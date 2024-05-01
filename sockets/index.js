const { Message } = require("../models");

const socketIO = require("socket.io");
function socketHandler(server) {
    const io = socketIO(server, {
        cors: {
            origin: "http://localhost:3000",
        },
    });

    const players = [];
    const nickInfo = {};
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
            // 3. 객체변경 후 클라이언트에게 변경된 객체정보 전달
            io.emit("updateNicks", nickInfo); // 나 포함
        });

        socket.on("send", async (msgData) => {
            console.log(msgData);
            // msgData={myNick, dm, msg}

            try {
                // 메시지를 데이터베이스에 저장합니다.
                const newMessage = await Message.create({
                    u_seq: msgData.myNick, // 보낸 사용자의 닉네임
                    content: msgData.msg, // 메시지 내용
                    d_seq: msgData.dm, // 해당 DM 방의 식별자
                });

                // 해당 DM 방에 있는 모든 사용자에게 메시지를 전송합니다.
                io.to(msgData.dm).emit("message", {
                    id: msgData.myNick,
                    message: msgData.msg,
                    isDm: true,
                });

                // 메시지를 보낸 사용자에게도 메시지를 전송합니다.
                socket.emit("message", {
                    id: msgData.myNick,
                    message: msgData.msg,
                    isDm: true,
                });
            } catch (error) {
                console.error("메시지 저장 중 오류 발생:", error);
                // 발생한 오류를 적절히 처리합니다.
            }
        });
        socket.on("drawing", (data) => {
            // console.log("Received drawing data:", data);
            io.emit("drawing", data);
        });

        ///////////////////////////////////////////
        const MAX_PLAYERS = 6; // 최대 플레이어 수

        socket.emit("gameId", socket.id);
        socket.on("loginUser", (loginUser) => {
            const player = {
                id: loginUser.id,
                nickName: loginUser.nickName,
                score: 100,
                socketId: socket.id,
            };

            // 이미 같은 소켓 ID를 가진 플레이어가 있는지 확인
            const isPlayerExist = players.some((player) => player.socketId === socket.id);
            if (isPlayerExist) {
                // 이미 존재하는 플레이어라면 에러 메시지 전송
                // socket.emit("errorMsg", "이미 존재하는 유저입니다.");
            } else {
                // 존재하지 않는 경우, 새로운 플레이어를 추가
                players.push(player);
                console.log(">>", players);
                const currentPlayers = players.length;
                if (currentPlayers > MAX_PLAYERS) {
                    // 만약 최대 플레이어 수를 초과하면 에러 메시지를 전송합니다.
                    socket.emit("errorMsg", "최대 플레이어 수를 초과하여 입장할 수 없습니다.");
                    return; // 함수 실행 종료
                }
                io.emit("updateUserId", players);
            }

            // Object.values(nickInfo)= ['닉네임1','닉네임2']
            // if (Object.values(player).includes(socket.id)) {
        });

        //퇴장
        socket.on("disconnect", () => {
            // 퇴장한 플레이어의 소켓 ID를 가져옵니다.
            const disconnectedPlayerIndex = players.findIndex(
                (player) => player.socketId === socket.id
            );

            if (disconnectedPlayerIndex !== -1) {
                // 해당 플레이어가 배열에 존재하는 경우에만 삭제합니다.

                players.splice(disconnectedPlayerIndex, 1); // 배열에서 해당 플레이어 삭제  (해당 인덱스에서 하나만 삭제)
                io.emit("updateUserId", players); // 변경된 플레이어 목록을 클라이언트에게 전달
            }
        });
    });
}

module.exports = socketHandler;
