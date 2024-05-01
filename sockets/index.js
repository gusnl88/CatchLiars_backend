const { Message, Alarm } = require("../models");

const socketIO = require("socket.io");
function socketHandler(server) {
    const io = socketIO(server, {
        cors: {
            origin: "http://localhost:3000",
        },
    });

    const nickInfo = {};
    const lastId = {}; // 퇴장한 사용자의 정보 저장
    // {socket.id:닉네임1, socket.id: 닉네임2}
    io.on("connection", (socket) => {
        // io.emit("notice", `${socket.id}님이 입장하셨습니다.`);

        socket.on("checkNick", (nickname) => {
            // console.log(nickname);

            // [닉네임사용2] 중복 체크 후
            // 입장실패, 입장성공 각각의 경우에 대해 클라이언트에게
            // 데이터 보내주기

            // Object.values(nickInfo)= ['닉네임1','닉네임2']
            if (Object.values(nickInfo).includes(nickname)) {
                // 닉네임이 nickInfo에 있을 때[입장 실패]
                socket.emit("error", "이미 존재하는 닉네임입니다.");
            } else {
                // 닉네임이 nickInfo에 없을 때[입장 성공]
                // (1)일치하는게 없을 때, nickInfo에 닉네임정보 넣기
                nickInfo[socket.id] = nickname;
                // (2)입장 성공 닉네임 정보 클라이언트에게 전달
                socket.emit("entrySuccess", nickname);
                // (3)입장성공, 전체클라이언트에게 입장 알림 보내주기
                socket.broadcast.emit("notice", `${nickInfo[socket.id]}님이 입장하셨습니다.`);
                // (4)입장성공, 전체 클라이언트에게 nickInfo전달
                io.emit("updateNicks", nickInfo);
            }
        });

        // 퇴장
        socket.on("disconnect", () => {
            // 1. ~님이 퇴장하셨습니다. 공고 화면에 띄우기
            io.emit("notice", `${nickInfo[socket.id]}님이 퇴장하셨습니다.`);
            // 2. nickInfo {}에서 특정 키 삭제
            delete nickInfo[socket.id]; // 키아이디가 들어가야하는 부부. 대괄호 표기법사용 - 어떤 아이디인지 정확하지 않기때문.

            lastId[socket.id] = true;

            // 3. 객체변경 후 클라이언트에게 변경된 객체정보 전달
            io.emit("updateNicks", nickInfo); // 나 포함
        });

        socket.on("send", async (msgData) => {
            try {
                const { myNick, dm, msg } = msgData;

                // 메시지를 데이터베이스에 저장합니다.
                const newMessage = await Message.create({
                    u_seq: myNick, // 보낸 사용자의 닉네임
                    content: msg, // 메시지 내용
                    d_seq: dm, // 해당 DM 방의 식별자
                });

                // 해당 DM 방에 있는 모든 사용자에게 메시지를 전송합니다.
                io.to(dm).emit("message", {
                    id: myNick,
                    message: msg,
                    isDm: true,
                });

                // 메시지를 보낸 사용자에게도 메시지를 전송합니다.
                socket.emit("message", {
                    id: myNick,
                    message: msg,
                    isDm: true,
                });

                // 퇴장되지 않은 사용자의 메시지 중 자신의 메시지를 제외하고 상대방의 메시지의 is_read를 1로 변경합니다.
                await Message.update(
                    { is_read: 1 }, // is_read를 1로 변경
                    {
                        where: {
                            d_seq: dm, // 해당 DM 방의 식별자
                            u_seq: { [Op.ne]: myNick }, // 자신의 메시지를 제외하고 상대방의 메시지만 선택
                        },
                    }
                );

                // 마지막으로 퇴장한 사용자가 있는지 확인하고 알림을 생성합니다.
                if (Object.keys(lastId).length > 0) {
                    const lastDisconnectedId = Object.keys(lastId)[0];
                    await createAlarm(dm, lastDisconnectedId);
                }
            } catch (error) {
                console.error("메시지 저장 중 오류 발생:", error);
                // 발생한 오류를 적절히 처리합니다.
            }
        });
    });
}

// 알림을 생성하고 저장하는 함수
const createAlarm = async (d_seq, u_seq, sender_nick) => {
    try {
        await Alarm.create({
            d_seq, // 해당 DM 방의 식별자
            u_seq: u_seq, // 알람을 받는 사용자
            coment: `${sender_nick}님이 메시지를 보냈습니다.`,
        });
    } catch (error) {
        console.error("알림 생성 중 오류 발생:", error);
    }
};

module.exports = socketHandler;
