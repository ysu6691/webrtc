import * as faceapi from 'face-api.js'
import { TinyFaceDetectorOptions } from 'face-api.js'
import { useEffect, useRef, useState } from 'react';

// 비디오 사이즈 설정
const constraints = {
  video: {
    width: 640,
    height: 480,
  },
  audio: false,
};

function App() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isStartDetect, setIsStartDetect] = useState<boolean>(false);
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);

  // 라벨링 할 인물 이미지 로컬에서 가져오기
  const loadImage = async () => {
    // 업로드 된 이미지 이름을 배열에 담아 라벨링 합니다.
    const labels = ["you", "haemin"];

    return Promise.all(
      labels.map(async (label) => {
        const images = await faceapi.fetchImage(require(`./imgs/${label}.jpg`));
        const descriptions = [];
        const detections = await faceapi
          .detectSingleFace(images)
          .withFaceLandmarks()
          .withFaceDescriptor()
        descriptions.push(detections!.descriptor)

        return new faceapi.LabeledFaceDescriptors(label, descriptions);
      })
    );
  };

  const onPlay = async () => {
    // 이미지 정보를 기반으로 canvas 요소 생성
    const canvas = faceapi.createCanvasFromMedia(videoRef.current!);
    wrapRef.current!.append(canvas);

    // 영상 사이즈를 canvas에 맞추기 위한 설정
    const displaySize: {width: number, height: number} = {
      width: videoRef.current!.width,
      height: videoRef.current!.height,
    };

    // canvas 사이즈를 맞춤
    faceapi.matchDimensions(canvas, displaySize);

    // 로컬 대조 이미지 가져오기
    const labeledFaceDescriptors = await loadImage();

    // 안면 인식 부분
    const faceDetecting = async () => {
      const detections = await faceapi
        .detectAllFaces(videoRef.current!, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender()
        .withFaceDescriptors();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // canvas 초기화
      canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);

      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

      resizedDetections.forEach((detection, i) => {
        const matched = resizedDetections[i];
        const box = matched.detection.box;
        const label = faceMatcher.findBestMatch(matched.descriptor).toString();
        const drawBox = new faceapi.draw.DrawBox(box, {
          label: label,
        });
        drawBox.draw(canvas);
        // 기본 안면 인식 테두리, 겹치므로 제외
        // faceapi.draw.drawDetections(canvas, resizedDetections);
        // 감정 읽기
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      });
    };

    const loop = () => {
      faceDetecting();
      setTimeout(loop, 1);
    };
    setTimeout(loop, 1);
  };

  const startDetecting = async () => {
    // model load
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + "/models";

      Promise.all([
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        // video 에서 로드된 이미지 매칭 시 아래 모델이 필요 함.
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
      ]).then(() => {
        setModelsLoaded(true);
        startVideo();
      });
    };

    loadModels();
  };

  // 영상 권한 요청
  const startVideo = () => {
    setIsStartDetect(true);

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => ((videoRef.current as any).srcObject = stream))
      .catch((err) => console.error(err));
  };

  return (
    <div>
      <h2>Face-Api Video Test</h2>
      <ul>
        <li>model loaded: {modelsLoaded.toString()}</li>
      </ul>

      <div ref={wrapRef}>
        <video
          ref={videoRef}
          autoPlay
          muted
          onPlay={onPlay}
          width={640}
          height={480}
        />
      </div>

      <button onClick={startDetecting}>영상 권한 호출</button>
    </div>
  );
}

export default App;
