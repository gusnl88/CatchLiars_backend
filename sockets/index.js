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
    const userList = {};
    const vote = {};
    const mafiaList = {};
    const citizen = {};
    io.on("connection", (socket) => {
        // io.emit("notice", `${socket.id}님이 입장하셨습니다.`);

        console.log("Client connected");

        socket.on("joinRoom", ({ roomId, userId, isDM }) => {
            if (isDM) {
                socket.join(`dm_room_${d_seq}`);
                console.log(`Socket ${socket.id} joined dm room ${d_seq}`);
            } else {
                socket.join(`room_${roomId}`);
                if (!userList[roomId]) {
                    userList[roomId] = {}; // roomId를 키로 가지는 객체 생성
                }
                userList[roomId][socket.id] = { userId, roomId }; // roomId 안에 socket.id를 키로 가지는 객체 생성
                console.log("유저리스트", userList);
                console.log(`환영합니다 ${userId} room_${roomId}`);
                const message = `${userId}님이 room_${roomId}방에 입장하셨습니다.`;

                io.to(`room_${roomId}`).emit("userList", getUserList(roomId));

                socket.broadcast.to(`room_${roomId}`).emit("message", { message, type: "message" });
            }
        });

        socket.on("message", ({ roomId, message }) => {
            // console.log(`Message in room_${roomId}:`, message);
            // console.log(userList[roomId][socket.id].userId);
            // console.log({message:message,type:'message'})
            message = `${userList[roomId][socket.id].userId} : ${message}`;
            io.to(`room_${roomId}`).emit("message", { message, type: "message" });
        });
        socket.on("vote", ({ userId, roomId, isDaytime }) => {
            console.log(userId, roomId, isDaytime);
            if (!vote[roomId]) {
                vote[roomId] = []; // roomId를 키로 가지는 배열 생성
            }
            vote[roomId].push(userId);
            console.log("vote", vote);
            console.log("유저리스트", userList);
            const sum = userList[roomId] ? Object.keys(userList[roomId]).length : 0;
            console.log(sum, "썸썸");

            if (
                vote[roomId].length === sum ||
                (!isDaytime && vote[roomId].length === mafiaList[roomId].length)
            ) {
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
                if (!isDaytime) {
                    // 밤에 실행할 코드
                    message = `-마피아에의해- 선량한 시민 ${maxVote}님은 마피아에 의해 사망하셨습니다.3초후 퇴장처리 됩니다`;
                    const index = citizen[roomId].indexOf(maxVote);
                    if (index !== -1) {
                        citizen[roomId].splice(index, 1);
                    }
                } else {
                    // 낮에 실행할 코드
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
                }
                io.to(`room_${roomId}`).emit("message", { message, type: "notice" });
                // 위에서 message 변수를 선언해주어야 함
                message = `${maxVote}님이 탈락하셨습니다.`;
                socket.broadcast.to(`room_${roomId}`).emit("message", { message, type: "message" });
                console.log("투표완료");
                resetVote(roomId); // 투표완료후 리스트 삭제.
                console.log("마피아갯수", Object.keys(mafiaList[roomId]).length);
                console.log("시민아갯수", Object.keys(citizen[roomId]).length);

                if (Object.keys(mafiaList[roomId]).length >= Object.keys(citizen[roomId]).length) {
                    message = "마피아가 승리했습니다.10초후 방은 폭파됩니다.수고하셧습니다"; //마피아가 승리했을경우 로직
                    io.to(`room_${roomId}`).emit("message", { message, type: "notice" });
                    io.to(`room_${roomId}`).emit("victory", "마피아승리");
                    resetMafiaCitizen(roomId);
                } else if (mafiaList[roomId].length === 0) {
                    message = "시민이 승리했습니다.10초후 방은 폭파됩니다.수고하셧습니다"; // 시민이 승리했을 경우 로직
                    io.to(`room_${roomId}`).emit("message", { message, type: "notice" });
                    io.to(`room_${roomId}`).emit("victory", "마피아승리");
                    resetMafiaCitizen(roomId);
                } else {
                    // 게임을 계속 진행합니다.
                    io.to(`room_${roomId}`).emit("restart", {
                        maxVote: maxVote,
                        mafiaList: mafiaList[roomId],
                        isDaytime: isDaytime,
                        userList: userList[roomId],
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
        function setMafia(roomId) {
            console.log(roomId);
            const users = Object.keys(userList[roomId]);
            let mafiaIndex, mafiaIndex2;

            // 랜덤으로 마피아 지목
            mafiaIndex = Math.floor(Math.random() * users.length);
            do {
                mafiaIndex2 = Math.floor(Math.random() * users.length);
            } while (mafiaIndex === mafiaIndex2);

            // 마피아 및 시민 리스트 초기화
            mafiaList[roomId] = [];
            citizen[roomId] = [];

            for (let i = 0; i < users.length; i++) {
                if (i === mafiaIndex || i === mafiaIndex2) {
                    mafiaList[roomId].push(userList[roomId][users[i]].userId);
                } else {
                    citizen[roomId].push(userList[roomId][users[i]].userId);
                }
            }

            // 마피아에게 전체 마피아 리스트를 전송
            io.to(users[mafiaIndex]).emit("job", { job: "마피아", mafiaList: mafiaList[roomId] });
            io.to(users[mafiaIndex2]).emit("job", { job: "마피아", mafiaList: mafiaList[roomId] });

            // 시민에게 전체 마피아 리스트를 전송하지 않음
            for (let i = 0; i < users.length; i++) {
                if (i !== mafiaIndex && i !== mafiaIndex2) {
                    io.to(users[i]).emit("job", { job: "시민", mafiaList: [] });
                }
            }

            console.log(mafiaList[roomId], "마피아갯수");
            console.log(citizen[roomId], "시민갯수");
            console.log(citizen);
            console.log(mafiaList);
        }

        // 게임 시작 이벤트
        socket.on("startGame", ({ roomId, isDaytime }) => {
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
                    socket.broadcast
                        .to(`room_${roomId}`)
                        .emit("message", { message, type: "message" });
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

module.exports = socketHandler;
