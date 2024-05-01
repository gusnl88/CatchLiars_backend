const { Message, Alarm } = require("../models");

const socketIO = require("socket.io");

function socketHandler(server) {
    const io = socketIO(server, {
        cors: {
            origin: "http://localhost:3000",
        },
    });

    const players = [];
    const nickInfo = {};
    const lastId = {}; // 퇴장한 사용자의 정보 저장
    // {socket.id:닉네임1, socket.id: 닉네임2}
    const userList = {};
    const vote = {};
    const mafiaList = {};
    const citizen = {};
    io.on("connection", (socket) => {
        // io.emit("notice", `${socket.id}님이 입장하셨습니다.`);

        console.log("Client connected");

        socket.on("joinRoom", ({ roomId, userId }) => {
            socket.join(`room_${roomId}`);
            if (!userList[roomId]) {
                userList[roomId] = {}; // roomId를 키로 가지는 객체 생성
            }
            userList[roomId][socket.id] = { userId, roomId }; // roomId 안에 socket.id를 키로 가지는 객체 생성
            console.log("유저리스트", userList);
            console.log(`환영합니다 ${userId} room_${roomId}`);
            const message = `${userId}님이 room_${roomId}방에 입장하셨습니다.`;

            io.to(`room_${roomId}`).emit("userList", getUserList(roomId));

            socket.broadcast.to(`room_${roomId}`).emit("message", message);
        });

        socket.on("message", async ({ roomId, message }) => {
            console.log(`Message in room_${roomId}:`, message);
            io.to(`room_${roomId}`).emit(
                "message",
                `${userList[roomId][socket.id].userId} : ${message}`
            );
        });
        socket.on("vote", ({ userId, roomId }) => {
            console.log(userId, roomId);
            if (!vote[roomId]) {
                vote[roomId] = []; // roomId를 키로 가지는 배열 생성
            }
            vote[roomId].push(userId);
            console.log("vote", vote);
            console.log("유저리스트", userList);
            const sum = userList[roomId] ? Object.keys(userList[roomId]).length : 0;
            console.log(sum, "썸썸");

            if (vote[roomId].length === sum) {
                let maxVote = "";
                let maxCount = 0;
                const voteCount = {};
                vote[roomId].forEach((item) => {
                    if (!voteCount[item]) {
                        voteCount[item] = 1;
                    } else {
                        voteCount[item]++;
                    }
                    if (voteCount[item] > maxCount) {
                        maxVote = item;
                        maxCount = voteCount[item];
                    }
                });

                console.log("가장 많이 투표받은 아이디:", maxVote);
                console.log(mafiaList[roomId]);
                console.log("마피아리스트랑비교할 유저리스트", userList[roomId]);
                let message;
                if (mafiaList[roomId].length > 0 && mafiaList[roomId].includes(maxVote)) {
                    message = `${maxVote}님의 직업은 마피아입니다. 사망 하셨습니다.3초후 퇴장처리 됩니다`;
                    const index = mafiaList[roomId].indexOf(maxVote);
                    if (index !== -1) {
                        mafiaList[roomId].splice(index, 1);
                    }
                } else {
                    message = `선량한 시민 ${maxVote}님은 마피아에 의해 사망하셨습니다.3초후 퇴장처리 됩니다`;
                    const index = citizen[roomId].indexOf(maxVote);
                    if (index !== -1) {
                        citizen[roomId].splice(index, 1);
                    }
                }
                io.to(`room_${roomId}`).emit("message", message);
                // 위에서 message 변수를 선언해주어야 함
                message = `${maxVote}님이 탈락하셨습니다.`;
                socket.broadcast.to(`room_${roomId}`).emit("message", message);
                console.log("투표완료");
                resetVote(roomId); // 투표완료후 리스트 삭제.
                console.log("마피아갯수", Object.keys(mafiaList[roomId]).length);
                console.log("시민아갯수", Object.keys(citizen[roomId]).length);

                if (Object.keys(mafiaList[roomId]).length >= Object.keys(citizen[roomId]).length) {
                    message = "마피아가 승리했습니다.10초후 방은 폭파됩니다.수고하셧습니다"; //마피아가 승리했을경우 로직
                    io.to(`room_${roomId}`).emit("message", message);
                    io.to(`room_${roomId}`).emit("victory", "마피아승리");
                    resetMafiaCitizen(roomId);
                } else if (mafiaList[roomId].length === 0) {
                    message = "시민이 승리했습니다.10초후 방은 폭파됩니다.수고하셧습니다"; // 시민이 승리했을 경우 로직
                    io.to(`room_${roomId}`).emit("message", message);
                    io.to(`room_${roomId}`).emit("victory", "마피아승리");
                    resetMafiaCitizen(roomId);
                } else {
                    // 게임을 계속 진행합니다.
                    io.to(`room_${roomId}`).emit("restart", {
                        maxVote: maxVote,
                        mafiaList: mafiaList[roomId],
                    });
                }

                // 게임 종료 후 마피아 리스트 초기화하지 않도록 수정
                // setMafia(roomId); // 마피아 리스트 초기화
                console.log(Object.keys(userList[roomId]).length);
            }
        });

        function resetVote(roomId) {
            delete vote[roomId];
        }
        function resetMafiaCitizen(roomId) {
            delete mafiaList[roomId];
            delete citizen[roomId];
        }
        // 랜덤 마피아 2명 설정
        function setMafia(roomId) {
            console.log(roomId);
            if (!mafiaList[roomId]) {
                mafiaList[roomId] = [];
            }
            if (!citizen[roomId]) {
                citizen[roomId] = [];
            }
            const users = Object.keys(userList[roomId]);
            const mafiaIndex = getRandomInt(0, users.length - 1);
            const mafiaIndex2 = getRandomInt(0, users.length - 1);

            for (let i = 0; i < users.length; i++) {
                if (i === mafiaIndex || i === mafiaIndex2) {
                    mafiaList[roomId].push(userList[roomId][users[i]].userId);
                    io.to(users[i]).emit("job", "마피아");
                } else {
                    citizen[roomId].push(userList[roomId][users[i]].userId);
                    io.to(users[i]).emit("job", "시민");
                }
            }
            console.log(mafiaList[roomId], "마피아갯수");
            console.log(citizen[roomId], "시민갯수");
            console.log(citizen);
            console.log(mafiaList);
        }

        // 랜덤 정수 생성 함수
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        // 게임 시작 이벤트
        socket.on("startGame", ({ roomId }) => {
            console.log(roomId);
            setMafia(roomId);
            console.log("마피아리스트", mafiaList);
        });
        socket.on("disconnect", () => {
            for (const roomId in userList) {
                if (userList[roomId][socket.id]) {
                    const { userId } = userList[roomId][socket.id];
                    const message = `${userId}님이 방을 나가셨습니다.`;
                    console.log(message);
                    delete userList[roomId][socket.id];
                    io.to(`room_${roomId}`).emit("userList", getUserList(roomId));
                    socket.broadcast.to(`room_${roomId}`).emit("message", message);
                }
            }
        });

        function getUserList(roomId) {
            const userLists = [];
            for (const socketId in userList[roomId]) {
                userLists.push(userList[roomId][socketId].userId);
            }
            return userLists;
        }
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

            // 중복 유저 확인
            const isPlayerExist = players.find(
                (player) => player.socketId === socket.id || player.id === loginUser.id
            );
            if (isPlayerExist) {
                // 이미 존재하는 플레이어라면 에러 메시지 전송
                // socket.emit("userError", "잘못된 경로입니다.");
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
