const { where } = require("sequelize");
const { Message ,User} = require("../models");
const { Op } = require("sequelize");

const socketIO = require("socket.io");

function socketHandler(server) {
    const io = socketIO(server, {
        cors: {
            origin: true,
        },
    });

    const players = [];
    const dmuser = {};
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

                socket.broadcast.to(`room_${roomId}`).emit("message", { message, type: "message" });
            
        });

        socket.on("message", ({ roomId, dm, msg }) => {
            let message = `${userList[roomId][socket.id].userId} : ${msg}`;
            const dmSocketId = Object.keys(userList[roomId]).find(//dm보낼 상대방 소켓 id 찾기
                (key) => userList[roomId][key].userId === dm
            );
            if (dm === "all") {
                //전체일시
                io.to(`room_${roomId}`).emit("message", { message, type: "message" });
            } else {
                //귓속말 상대방에게 메세지전달
                io.to(dmSocketId).emit("message", { message, type: "message", dm: "dm" });
                //  나 에게만 메세지 보내기
                socket.emit("message", { message, type: "message", dm: "dm" });
            }
        });
        socket.on("vote", ({ userId, roomId, isDaytime }) => {
            if (!vote[roomId]) {
                vote[roomId] = []; // roomId를 키로 가지는 배열 생성
            }
            vote[roomId].push(userId);
            const sum = userList[roomId] ? Object.keys(userList[roomId]).length : 0;

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

                let message;
                if (!isDaytime) {
                    // 밤에 실행할 코드
                    message = `선량한 시민 ${maxVote}님은 마피아에 의해 사망하셨습니다.3초후 퇴장처리 됩니다`;
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
                        message = `${maxVote}님은 선량한 시민이었습니다.3초후 퇴장처리 됩니다`;
                        const index = citizen[roomId].indexOf(maxVote);
                        if (index !== -1) {
                            citizen[roomId].splice(index, 1);
                        }
                    }
                }
                io.to(`room_${roomId}`).emit("message", { message, type: "notice" });
                io.to(`room_${roomId}`).emit("message", { message, type: "message" ,dm:"dm"});
                // 위에서 message 변수를 선언해주어야 함
                message = `${maxVote}님이 탈락하셨습니다.`;
                socket.broadcast.to(`room_${roomId}`).emit("message", { message, type: "message" ,dm:"dm"});
                resetVote(roomId); // 투표완료후 리스트 삭제.
                const userIdList = Object.values(userList[roomId]).map((user) => user.userId);

                if (Object.keys(mafiaList[roomId]).length >= Object.keys(citizen[roomId]).length) {
                    message = "마피아가 승리했습니다.수고하셧습니다"; //마피아가 승리했을경우 로직
                    io.to(`room_${roomId}`).emit("message", { message, type: "notice" ,dm:"notice"});
                    io.to(`room_${roomId}`).emit("message", { message, type: "messeage" ,dm:"dm"});
                    io.to(`room_${roomId}`).emit("victory", userIdList);
                    resetMafiaCitizen(roomId);
                } else if (mafiaList[roomId].length === 0) {
                    message = "시민이 승리했습니다.수고하셧습니다"; // 시민이 승리했을 경우 로직
                    io.to(`room_${roomId}`).emit("message", { message, type: "notice" ,dm:"notice"});
                    io.to(`room_${roomId}`).emit("message", { message, type: "messeage" ,dm:"dm"});
                    io.to(`room_${roomId}`).emit("victory", userIdList);
                    resetMafiaCitizen(roomId);
                } else {
                    // 게임을 계속 진행합니다.
                    io.to(`room_${roomId}`).emit("restart", {
                        maxVote: maxVote,
                        mafiaList: mafiaList[roomId],
                        isDaytime: isDaytime,
                        userList: userList[roomId],
                        dm:"notice"
                    });
                }

                // 게임 종료 후 마피아 리스트 초기화하지 않도록 수정
                // setMafia(roomId); // 마피아 리스트 초기화
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

        }

        // 게임 시작 이벤트
        socket.on("startGame", ({ roomId }) => {
            let message='낮입니다 의견을 자유롭게 나누세요';
            io.to(`room_${roomId}`).emit("message", { message, type: "message", dm: "dm" });
            setMafia(roomId);
            console.log("마피아리스트", mafiaList);

        });
        socket.on("disconnect", () => {
            for (const roomId in userList) {
                if (userList[roomId][socket.id]) {
                    const { userId } = userList[roomId][socket.id];
                    const message = `${userId}님이 방을 나가셨습니다.`;
                    delete userList[roomId][socket.id];
                    io.to(`room_${roomId}`).emit("userList", getUserList(roomId));
                    socket.broadcast
                        .to(`room_${roomId}`)
                        .emit("message", { message, type: "message" ,dm:"dm"});
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

        // -------------------------------------------------------------------dm방
        // dm방 입장 
        socket.on("room",async({roomId,userId,u_seq})=>{
            socket.join(`dm_room_${roomId}`);
            let message=`${userId}님이 입장하셨습니다.`
            if(!dmuser[roomId]){
                dmuser[roomId]=[];
            }
            
            const msg = await Message.update(
                { is_read: 1 },
                {
                    where: {
                        d_seq: roomId,
                        u_seq: {
                            [Op.ne]: u_seq
                        },
                        is_read: 0
                    }
                }
            );
            const msgList = await Message.findAll({
                where: {
                    d_seq: roomId
                },
                include: {
                    model: User,
                    attributes: ['id', 'nickName'] // 가져오고 싶은 아이디 관련 정보들
                }
            });
            console.log(msgList)
            io.to(`dm_room_${roomId}`).emit("msgList",msgList)
            if(Object.keys(dmuser[roomId]).length===2){
            }
            dmuser[roomId][socket.id]={userId}
            console.log(dmuser)
            socket.broadcast.to(`dm_room_${roomId}`).emit("message", { message: message });

        })
         socket.on("send", async ({msg,roomId,loginUser,u_seq}) => {
            console.log(msg);
            console.log(loginUser);
            let message;
            const currentTime = new Date().toISOString();
            console.log(Object.keys(dmuser[roomId]).length)
                message = Message.create({
                    u_seq: u_seq,
                    d_seq: roomId,
                    create_at: currentTime,
                    content: msg
                });
            // msgData={myNick, dm, msg}
            let newMessage=`${loginUser} : ${msg}`
            io.to(`dm_room_${roomId}`).emit("message",{message:newMessage,sendUser:loginUser,is_read:message.is_read});
        });
        // 퇴장
        socket.on("disconnect", () => {
            console.log("아웃")
            for (const roomId in dmuser) {
                if (dmuser[roomId][socket.id]) {
                    console.log(dmuser[roomId][socket.id].userId)
                    const userId=dmuser[roomId][socket.id].userId;
                    let message=`${userId}님이 퇴장 하셨습니다.`
                    io.to(`dm_room_${roomId}`).emit("message", {message:message,out:userId});
                            }
                        }            
        });

       

        ///////////////////////////////////////////
        // catchLiar

        socket.on("drawing", (data) => {
            // console.log("Received drawing data:", data);
            io.emit("drawing", data);
        });

        // socket.on("drawing1", (data) => {
        //     // console.log("Received drawing data:", data);
        //     io.emit("drawing1", data);
        // });

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
                // console.log(">>", players);
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

        ////////////////
        let gameData;
        // 클라이언트로부터의 게임 데이터 업데이트 요청 처리
        socket.on("gamestart", (gameStarted) => {
            io.emit("start", gameStarted);
        });

        socket.on("updateGameData", (data) => {
            // console.log(">>>", data);
            io.emit("updateGameData", data);
        });

        // 초기 게임 데이터 전송
        socket.emit("updateGameData", gameData);

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
