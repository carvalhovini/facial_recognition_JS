document.addEventListener('DOMContentLoaded', async () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const captureBtn = document.getElementById('captureBtn');
    const statusElement = document.getElementById('status');

    // Carregar o modelo da Face-api.js
    await faceapi.nets.tinyFaceDetector.loadFromUri('weights');
    await faceapi.nets.faceLandmark68Net.loadFromUri('weights');
    await faceapi.nets.faceRecognitionNet.loadFromUri('weights');

    // Obter a câmera do usuário
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;

    // Capturar rosto ao clicar no botão
    captureBtn.addEventListener('click', async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();

        if (detections.length > 0) {
            // O primeiro rosto detectado é utilizado para cadastro
            const faceDescriptor = detections[0].descriptor;

            // Armazenar no banco de dados simulado (localStorage neste exemplo)
            const personData = {
                name: prompt('Digite o nome da pessoa:'), // Solicitar nome da pessoa
                descriptor: faceDescriptor,
            };

            // Simular armazenamento no localStorage
            const storedData = JSON.parse(localStorage.getItem('faceData')) || [];
            storedData.push(personData);
            localStorage.setItem('faceData', JSON.stringify(storedData));

            // Mostrar pontos faciais no rosto detectado
            const displaySize = { width: video.width, height: video.height };
            faceapi.matchDimensions(canvas, displaySize);
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            // Atualizar status
            statusElement.textContent = 'Status: Rosto cadastrado';
        } else {
            statusElement.textContent = 'Status: Nenhum rosto detectado';
        }
    });

    // Função para encontrar pessoa correspondente
function findMatchingPerson(descriptor, storedData) {
    for (const person of storedData) {
        const storedDescriptor = person.descriptor;

        // Certifique-se de que os arrays têm o mesmo comprimento antes da comparação
        if (descriptor.length !== storedDescriptor.length) {
            continue;
        }

        // Igualar as dimensões dos descritores antes da comparação
        const equalizedDescriptor = faceapi.matchDimensions([descriptor], [storedDescriptor])[0];

        // Calcular a distância euclidiana
        const distance = faceapi.euclideanDistance(equalizedDescriptor, storedDescriptor);

        if (distance < 0.6) { // Ajuste este valor conforme necessário
            return person;
        }
    }
    return null;
}


    // Atualizar o canvas com as detecções faciais
    video.addEventListener('play', () => {
        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
            const displaySize = { width: video.width, height: video.height };
            faceapi.matchDimensions(canvas, displaySize);
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            // Verificar se o rosto corresponde a alguma pessoa cadastrada
            const storedData = JSON.parse(localStorage.getItem('faceData')) || [];
            for (const detection of resizedDetections) {
                const currentDescriptor = detection.descriptor;
                const match = findMatchingPerson(currentDescriptor, storedData);
                if (match) {
                    // Desenhar um quadrado em torno do rosto detectado
                    const box = detection.detection.box;
                    const drawBox = new faceapi.draw.DrawBox(box, { label: match.name });
                    drawBox.draw(canvas);
                    statusElement.textContent = `Status: Pessoa detectada - Nome: ${match.name}`;
                } else {
                    statusElement.textContent = 'Status: Rosto detectado';
                }
            }
        }, 100);
    });
});
