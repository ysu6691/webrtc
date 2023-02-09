import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Connection, OpenVidu, Session } from "openvidu-browser";
import axios from "axios";
import styled from "styled-components";

function Visitor() {
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [ownerConnection, setOwnerConnection] = useState<
    Connection | undefined
  >(undefined);

  const OV = useMemo(() => new OpenVidu(), []);
  const APPLICATION_SERVER_URL = "http://localhost:5000/";

  const mySessionId = "1234";
  const myUserName = "myUserName";

  // useEffect(() => {
  //   setSession(OV.initSession());
  // }, [OV]);

  // 스트리밍 화면 출력
  const streamRef = useRef<HTMLVideoElement>(null);

  // 세션 생성
  useEffect(() => {
    const newSession = OV.initSession();
    newSession.on("streamCreated", (event) => {
      const ownerStream = newSession.subscribe(
        event.stream,
        streamRef.current!
      );
      ownerStream?.addVideoElement(streamRef.current!);
    });
    // 메세지 받기
    newSession.on("signal", (event) => {
      // 초기 입장할 때 사업자 정보 받아서 저장
      if (event.type === "signal:welcome") {
        setOwnerConnection(event.from);
      }
      if (event.type === "signal:badge") {
        console.log("뱃지 받았다");
      }
    });
    setSession(newSession);
  }, [OV]);

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

  // 방 입장
  useEffect(() => {
    if (session !== undefined) {
      createToken(mySessionId).then((token: string) => {
        session.connect(token, { clientData: myUserName });
      });
    }
  }, [session]);

  // 세션 입장
  // const joinRoom = function () {
  //   getToken().then((token: string) => {
  //     if (session === undefined) {
  //       return;
  //     }
  //     session.connect(token, { clientData: myUserName });
  //   });
  // };

  return (
    <StyledContainer>
      <StyledVideo autoPlay={true} ref={streamRef} />
    </StyledContainer>
  );
}

export default Visitor;

const StyledContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: black;
`;

const StyledVideo = styled.video`
  width: 100%;
`;
