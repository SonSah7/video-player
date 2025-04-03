const videoPlayer = document.getElementById('videoPlayer');
const videoList = document.getElementById('videoList');
const uploadForm = document.getElementById('uploadForm');
const uploadFormContainer = document.getElementById('uploadFormContainer');
const uploadToggleBtn = document.getElementById('uploadToggleBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const volumeBtn = document.getElementById('volumeBtn');
const volumeSlider = document.getElementById('volumeSlider');
const statusToast = document.getElementById('statusToast');
const videoTitleInput = document.getElementById('videoTitle');
const videoFileInput = document.getElementById('videoFile');
const fileNameSpan = document.getElementById('fileName');

let videos = [];

function initApp() {
  loadVideos();
  setupEventListeners();
}

async function loadVideos() {
  try {
    showToast('Loading videos...', 'info');
    const response = await fetch('/api/videos');
    
    if (!response.ok) {
      throw new Error('Failed to load videos');
    }
    
    videos = await response.json();
    renderVideoList(videos);
    
    if (videos.length > 0) {
      playVideo(videos[0].path);
    }
    
    showToast('Videos loaded successfully', 'success');
  } catch (error) {
    console.error('Error loading videos:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

function renderVideoList(videos) {
  videoList.innerHTML = '';
  
  videos.forEach(video => {
    const videoItem = document.createElement('div');
    videoItem.className = 'video-item';
    videoItem.innerHTML = `
      <div class="video-thumbnail">
        <i class="fas fa-play"></i>
      </div>
      <div class="video-info">
        <div class="video-title">${video.title}</div>
        <div class="video-meta">
          <span><i class="fas fa-clock"></i> ${video.size}</span>
          <span><i class="fas fa-calendar-alt"></i> ${new Date(video.date).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="video-actions">
        <button class="delete-btn" data-id="${video.id}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    
    videoItem.addEventListener('click', () => {
      document.querySelectorAll('.video-item').forEach(item => {
        item.classList.remove('active');
      });
      videoItem.classList.add('active');
      playVideo(video.path);
    });
    
    videoList.appendChild(videoItem);
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await deleteVideo(btn.dataset.id);
    });
  });
}

function playVideo(path) {
  videoPlayer.src = path;
  videoPlayer.load();
  
  videoPlayer.oncanplay = () => {
    videoPlayer.play()
      .then(() => {
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        updateTimeDisplay();
      })
      .catch(error => {
        console.log('Autoplay prevented:', error);
        showToast('Click play to start video', 'info');
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
      });
  };
  
  videoPlayer.onerror = () => {
    showToast('Error playing video', 'error');
  };
}

async function deleteVideo(id) {
  if (!confirm('Are you sure you want to delete this video?')) return;
  
  try {
    showToast('Deleting video...', 'info');
    const response = await fetch(`/api/videos/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete video');
    }
    
    await loadVideos();
    showToast('Video deleted successfully', 'success');
  } catch (error) {
    console.error('Error deleting video:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = videoFileInput.files[0];
  
  if (!file) {
    showToast('Please select a video file', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('video', file); // No title needed

  try {
    showToast('Uploading video...', 'info');
    const response = await fetch('/api/videos', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }
    
    const newVideo = await response.json();
    uploadForm.reset();
    fileNameSpan.textContent = 'No file selected';
    uploadFormContainer.classList.remove('show');
    await loadVideos();
    playVideo(newVideo.path);
    showToast('Video uploaded successfully!', 'success');
  } catch (error) {
    console.error('Upload error:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
});

function setupEventListeners() {
  uploadToggleBtn.addEventListener('click', () => {
    uploadFormContainer.classList.toggle('show');
  });
  
  videoFileInput.addEventListener('change', () => {
    if (videoFileInput.files.length > 0) {
      fileNameSpan.textContent = videoFileInput.files[0].name;
    } else {
      fileNameSpan.textContent = 'No file selected';
    }
  });
  
  playPauseBtn.addEventListener('click', () => {
    if (videoPlayer.paused) {
      videoPlayer.play()
        .then(() => {
          playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        })
        .catch(error => {
          console.error('Play error:', error);
        });
    } else {
      videoPlayer.pause();
      playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
  });
  
  videoPlayer.addEventListener('timeupdate', updateProgressBar);
  progressBar.addEventListener('input', () => {
    videoPlayer.currentTime = progressBar.value * videoPlayer.duration;
  });
  
  volumeSlider.addEventListener('input', () => {
    videoPlayer.volume = volumeSlider.value;
    if (videoPlayer.volume > 0) {
      volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    } else {
      volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
  });
  
  volumeBtn.addEventListener('click', () => {
    if (videoPlayer.volume > 0) {
      videoPlayer.volume = 0;
      volumeSlider.value = 0;
      volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else {
      videoPlayer.volume = 1;
      volumeSlider.value = 1;
      volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
  });
  
  fullscreenBtn.addEventListener('click', () => {
    if (videoPlayer.requestFullscreen) {
      videoPlayer.requestFullscreen();
    } else if (videoPlayer.webkitRequestFullscreen) {
      videoPlayer.webkitRequestFullscreen();
    } else if (videoPlayer.msRequestFullscreen) {
      videoPlayer.msRequestFullscreen();
    }
  });
  
  videoPlayer.addEventListener('ended', () => {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  });
}

function updateProgressBar() {
  progressBar.value = videoPlayer.currentTime / videoPlayer.duration;
  updateTimeDisplay();
}

function updateTimeDisplay() {
  currentTimeEl.textContent = formatTime(videoPlayer.currentTime);
  durationEl.textContent = formatTime(videoPlayer.duration);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function showToast(message, type) {
  statusToast.textContent = message;
  statusToast.className = `toast show ${type}`;
  
  setTimeout(() => {
    statusToast.classList.remove('show');
  }, 3000);
}

document.addEventListener('DOMContentLoaded', initApp);