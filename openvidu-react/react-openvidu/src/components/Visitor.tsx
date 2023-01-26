import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  OpenVidu,
  Session,
  Subscriber,
  Device,
  Publisher,
  Connection,
} from "openvidu-browser";
import axios from "axios";

function Visitor() {
  const [session, setSession] = useState<undefined | Session>(undefined); // 세션
  const [ownerConnection, setOwnerConnection] = useState<
    Connection | undefined
  >(undefined);

  const OV = useMemo(() => new OpenVidu(), []);
  const APPLICATION_SERVER_URL = "http://localhost:5000/";

  let mySessionId: string;
  let myUserName: string;

  useEffect(() => {
    setSession(OV.initSession());
  }, [OV]);

  // 세션 생성
  // const createSession = async function (
  //   sessionId: string
  // ): Promise<string | void> {
  //   const response = await axios({
  //     method: "post",
  //     url: APPLICATION_SERVER_URL + "api/sessions",
  //     data: JSON.stringify({ customSessionId: sessionId }),
  //     headers: { "Content-Type": "application/json" },
  //   });
  //   return response.data;
  // };

  // 토큰 생성
  const createToken = async function (sessionId: string) {
    const response = await axios({
      method: "post",
      url:
        APPLICATION_SERVER_URL + "api/sessions/" + sessionId + "/connections",
      data: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  };

  // 토큰 가져오기
  const getToken = async function () {
    return await createToken(mySessionId);
  };

  // 세션 입장
  const mySessionIdInputRef = useRef<HTMLInputElement>(null);
  const myUserNameInputRef = useRef<HTMLInputElement>(null);
  const joinRoom = async function (event: FormEvent) {
    event.preventDefault();
    mySessionId = mySessionIdInputRef.current!.value;
    myUserName = myUserNameInputRef.current!.value;
    getToken()
      .then((token: string) => {
        session?.connect(token, { clientData: myUserName }).then(async () => {
          console.log("연결 성공");
        });
      })
      .catch((err) => console.log(err));
  };

  // 세션 나가기
  const leaveSession = function () {
    session?.disconnect();
  };

  // 스트리밍 화면 출력
  const streamRef = useRef<HTMLVideoElement>(null);
  session?.on("streamCreated", (event) => {
    const ownerStream = session.subscribe(event.stream, streamRef.current!);
    ownerStream.addVideoElement(streamRef.current!);
  });

  // 먹이주기
  const feedInputRef = useRef<HTMLInputElement>(null);
  const vote = function (event: FormEvent) {
    event.preventDefault();
    if (ownerConnection !== undefined) {
      session
        ?.signal({
          data: feedInputRef.current!.value,
          to: [ownerConnection],
          type: "vote",
        })
        .then(() => {
          console.log("메세지 보냄");
          feedInputRef.current!.value = "";
        })
        .catch((err) => console.log(err));
    }
  };

  // 메세지 받기
  session?.on("signal", (event) => {
    // 초기 입장할 때 사업자 정보 받아서 저장
    if (event.type === "signal:welcome") {
      setOwnerConnection(event.from);
    }
    if (event.type === "signal:badge") {
      console.log("뱃지 받았다");
    }
  });

  // console.log("p:", publisher);
  // console.log("m: ", mainStreamManager);
  // console.log("c: ", currentVideoDevice);

  return (
    <div>
      <h1>참가자</h1>
      <form onSubmit={joinRoom}>
        <input type="text" placeholder="세션 ID" ref={mySessionIdInputRef} />
        <input type="text" placeholder="닉네임" ref={myUserNameInputRef} />
        <button>입장</button>
      </form>
      <button onClick={leaveSession}>퇴장</button>
      <form onSubmit={vote}>
        <input type="text" placeholder="먹이 입력" ref={feedInputRef} />
        <button>투표</button>
      </form>
      <video autoPlay={true} ref={streamRef} />
    </div>
  );
}

export default Visitor;
