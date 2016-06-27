var allowedTypes = ['image/jpg', 'image/png', 'image/jpeg', 'audio/mp3', 'audio/ogg', 'video/mp4', 'video/webm', 'video/ogv']

var storage = firebase.storage();
var storageRef = storage.ref();

var savedData = {
  name: '',
  profile: '',
  start_date: '',
  end_date: '',
  files: []
}

document.querySelector('#name').onblur = function(e) {
  savedData.name = e.target.value;
}

document.querySelector('#profile').onblur = function(e) {
  savedData.profile = e.target.value;
}

document.querySelector('#start_date').onblur = function(e) {
  savedData.start_date = e.target.value;
}

document.querySelector('#end_date').onblur = function(e) {
  savedData.end_date = e.target.value;
}

function upload() {
  // File or Blob named mountains.jpg
  var file = document.querySelector('#input').files[0];
  if (allowedTypes.indexOf(file.type) === -1) {
    alert('不支持该文件格式!')
    return;
  }

  var refName = file.type.split('/')[0] + 's/' + file.name;

  var uploadTask = storageRef.child(refName).put(file);

  // Listen for state changes, errors, and completion of the upload.
  uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
    function(snapshot) {
      // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
      var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      document.getElementById('progress').innerHTML = '已完成：' + progress.toFixed(0) + '%';
      console.log('Upload is ' + progress + '% done');
      switch (snapshot.state) {
        case firebase.storage.TaskState.PAUSED: // or 'paused'
          console.log('Upload is paused');
          break;
        case firebase.storage.TaskState.RUNNING: // or 'running'
          console.log('Upload is running');
          break;
      }
    }, function(error) {
    switch (error.code) {
      case 'storage/unauthorized':
        // User doesn't have permission to access the object
        break;

      case 'storage/canceled':
        // User canceled the upload
        break;

      case 'storage/unknown':
        // Unknown error occurred, inspect error.serverResponse
        break;
    }
  }, function() {
    document.getElementById('progress').innerHTML = '';
    var ul = document.querySelector('.preview');
    var li = document.createElement('li');
    // Upload completed successfully, now we can get the download URL
    var downloadURL = uploadTask.snapshot.downloadURL;
    document.querySelector('#input').value = '';
    switch(file.type.split('/')[0]) {
      case 'image':
        li.innerHTML = '<img src="' + downloadURL + '">';
        savedData.files.push({
          cover: downloadURL,
          thumb: downloadURL,
          source: downloadURL,
          title: '',
          description: '',
          _type: 'photo'
        });
        break;
      case 'audio':
        li.innerHTML = '<audio-playback src="' + downloadURL + '" type="' + file.type + '"></audio-playback>';
        savedData.files.push({
          cover: 'http://haocong.github.io/ccgallery/media/audios/thumbs/audio-thumb1.jpg',
          thumb: 'http://haocong.github.io/ccgallery/media/audios/thumbs/audio-thumb1.jpg',
          source: [downloadURL],
          title: '',
          description: '',
          _type: 'audio'
        });
        break;
      case 'video':
        li.innerHTML = '<video src="' + downloadURL + '">Sorry, your browser doesn\'t support embedded videos.</video>';
        savedData.files.push({
          cover: 'http://haocong.github.io/ccgallery/media/audios/thumbs/video-thumb1.jpg',
          thumb: 'http://haocong.github.io/ccgallery/media/audios/thumbs/video-thumb1.jpg',
          source: [downloadURL],
          title: '',
          description: '',
          _type: 'video'
        });
        break;
    }
    ul.appendChild(li)
  });
}

function submit() {
  firebase.database().ref().push(savedData).then(function() {
    alert('上传成功');
    window.location.reload();
  });
}
