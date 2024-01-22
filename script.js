document.addEventListener('DOMContentLoaded', async () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const statusElement = document.getElementById('status');

    // Carregar modelos mais precisos da Face-api.js
    await faceapi.nets.ssdMobilenetv1.loadFromUri('weights');
    await faceapi.nets.faceLandmark68Net.loadFromUri('weights');
    await faceapi.nets.faceRecognitionNet.loadFromUri('weights');

    // Obter a câmera do usuário
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;

    // Configurar as dimensões do canvas para corresponder ao vídeo
    video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    });

    // Atualizar o canvas com as detecções faciais
    video.addEventListener('play', () => {
        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptors();
            const displaySize = { width: video.width, height: video.height };
            faceapi.matchDimensions(canvas, displaySize);
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            // Verificar se o rosto corresponde a alguma pessoa cadastrada
            const storedData = JSON.parse(localStorage.getItem('faceData')) || [];
            if (detections.length > 0) {
                const currentDescriptor = detections[0].descriptor;
                const match = findMatchingPerson(currentDescriptor, storedData);
                if (match) {
                    // Atualizar status
                    updateStatus(`Pessoa detectada - Nome: ${match.name}`);
                } else {
                    // Atualizar status
                    updateStatus('Rosto detectado, mas não reconhecido');
                }
            } else {
                // Atualizar status
                updateStatus('Nenhum rosto detectado');
            }
        }, 30); // Reduzindo o intervalo para 30 milissegundos
    });
});

function updateStatus(message) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = `Status: ${message}`;
}

function findMatchingPerson(currentDescriptor, storedData) {
    let bestMatch = null;
    let bestDistance = Number.MAX_VALUE;

    storedData.forEach(person => {
        if (person.descriptor.length === currentDescriptor.length) {
            const distance = faceapi.euclideanDistance(currentDescriptor, person.descriptor);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestMatch = person;
            }
        }
    });

    // Retornar apenas se a distância for menor que um limite (ajuste conforme necessário)
    return bestDistance < 0.6 ? bestMatch : null;
}
