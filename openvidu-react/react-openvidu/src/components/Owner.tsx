import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  OpenVidu,
  Session,
  Subscriber,
  Device,
  Publisher,
} from "openvidu-browser";
import axios from "axios";

const Owner = function () {
  const [mySessionId, setMySessionId] = useState<string>("SessionA"); // 세션 id
  const [myUserName, setMyUserName] = useState<string>("Participant"); // 참가자 닉네임
  const [session, setSession] = useState<undefined | Session>(undefined); // 세션
  const [mainStreamManager, setMainStreamManager] = useState<
    Publisher | undefined
  >(undefined); // 메인 스트림
  const [publisher, setPublisher] = useState<Publisher | undefined>(undefined); // 로컬 스트림
  const [currentVideoDevice, setCurrentVideoDevice] = useState<
    Device | undefined
  >(undefined); // 현재 비디오 출력중인 기기

  const OV = useMemo(() => new OpenVidu(), []);
  const APPLICATION_SERVER_URL = "http://localhost:5000/";

  useEffect(() => {
    setSession(OV.initSession());
  }, [OV]);

  // 세션 생성
  const createSession = async function (
    sessionId: string
  ): Promise<string | void> {
    const response = await axios({
      method: "post",
      url: APPLICATION_SERVER_URL + "api/sessions",
      data: JSON.stringify({ customSessionId: sessionId }),
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  };

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
    const sessionId = await createSession(mySessionId);
    if (typeof sessionId === "string") {
      return await createToken(sessionId);
    }
  };

  // 세션 입장
  const mySessionIdInputRef = useRef<HTMLInputElement>(null);
  const myUserNameInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<HTMLVideoElement>(null);
  const joinRoom = async function (event: FormEvent) {
    event.preventDefault();
    await setMySessionId(mySessionIdInputRef.current!.value);
    await setMyUserName(myUserNameInputRef.current!.value);
    getToken()
      .then((token: string) => {
        session?.connect(token, { clientData: myUserName }).then(async () => {
          const newPublisher = await OV.initPublisherAsync(undefined, {
            audioSource: undefined, // The source of audio. If undefined default microphone
            videoSource: undefined, // The source of video. If undefined default webcam
            publishAudio: false, // Whether you want to start publishing with your audio unmuted or not
            publishVideo: true, // Whether you want to start publishing with your video enabled or not
            resolution: "640x480", // The resolution of your video
            frameRate: 30, // The frame rate of your video
            insertMode: "APPEND", // How the video is inserted in the target element 'video-container'
            mirror: true, // Whether to mirror your local video or not
          });

          // 세션에 스트리밍 등록
          session.publish(newPublisher);

          // 현재 사용 가능한 비디오 가져오기
          const devices = await OV.getDevices();
          const videoDevices = devices.filter(
            (device) => device.kind === "videoinput"
          );
          const currentVideoDeviceId = newPublisher.stream
            .getMediaStream()
            .getVideoTracks()[0]
            .getSettings().deviceId;
          const newCurrentVideoDevice = videoDevices.find(
            (device) => device.deviceId === currentVideoDeviceId
          );

          // 사업자 스트리밍 출력
          newPublisher.addVideoElement(streamRef.current!);

          setCurrentVideoDevice(newCurrentVideoDevice);
          setMainStreamManager(newPublisher);
          setPublisher(newPublisher);
        });
      })
      .catch((err) => console.log(err));
  };

  // 세션 나가기
  const leaveSession = function () {
    session?.disconnect();
  };

  // 새로운 커넥션 생길 때마다 사업자 정보 보내기
  session?.on("connectionCreated", (event) => {
    session?.signal({
      data: mySessionId,
      to: [event.connection],
      type: "welcome",
    });
  });

  // 뱃지 뿌리기
  const sendBadge = function (event: FormEvent) {
    event.preventDefault();
    session
      ?.signal({
        data: "",
        to: [],
        type: "badge",
      })
      .then(() => {
        console.log("메세지 보냄");
      })
      .catch((err) => console.log(err));
  };

  // 투표 받기
  session?.on("signal:vote", (event) => {
    console.log(event.data);
  });

  // console.log("p:", publisher);
  // console.log("m: ", mainStreamManager);
  // console.log("c: ", currentVideoDevice);

  return (
    <div>
      <form onSubmit={joinRoom}>
        <input type="text" placeholder="세션 ID" ref={mySessionIdInputRef} />
        <input type="text" placeholder="닉네임" ref={myUserNameInputRef} />
        <button>입장</button>
      </form>
      <button onClick={leaveSession}>퇴장</button>
      <form onSubmit={sendBadge}>
        <button>뱃지 뿌리기</button>
      </form>
      <video autoPlay={true} ref={streamRef} />
    </div>
  );
};

export default Owner;
