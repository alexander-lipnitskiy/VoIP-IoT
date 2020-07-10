var client = require('ari-client'),
    Promise = require('bluebird'),
    util = require('util');

client.connect('http://localhost:8088', 'asterisk', 'asterisk')
  .then(function (ari) {

    ari.on('StasisStart', channelJoined);
    ari.on('StasisEnd', (event, channel)=> {console.log('end')});

    function channelJoined (event, incoming) {
      incoming.on('ChannelDtmfReceived', dtmfReceived);

      incoming.answer()
        .then(function () {
           // play(incoming, 'sound:hello-world')
          return play(incoming, 'sound:http://localhost:3000/intro.wav');
        })
        .catch(function (err) {
            console.log(err)});
    }

    function dtmfReceived (event, channel) {
      var digit = event.digit;
      switch (digit) {
        case '#':
          play(channel, 'sound:vm-goodbye')
            .then(function () {
              return channel.hangup();
            })
            .finally(function () {
                console.log(err)
              //process.exit(0);
            });
          break;
        case '*':
          play(channel, 'sound:http://localhost:3000/intro.wav');
          break;
        case '1':
            play(channel, 'sound:http://localhost:3000/heart-rate.wav');
            break;
        case '2':
            play(channel, 'sound:http://localhost:3000/step-count.wav');
            break;
        case '3':
            play(channel, 'sound:http://localhost:3000/sleep.wav');
            break;
        case '4':
            play(channel, 'sound:http://localhost:3000/air-quality.wav');
            break;
        case '5':
            play(channel, 'sound:http://localhost:3000/led-on.wav');
            break;
        case '6':
            play(channel, 'sound:http://localhost:3000/led-off.wav');
            break;
        case '7':
            play(channel, 'sound:http://localhost:3000/motion.wav');
            break;
        case '8':
            play(channel, 'sound:http://localhost:3000/light.wav');
            break;
        default:
          play(channel, util.format('sound:digits/%s', digit));
      }
    }

    function play (channel, sound) {
      var playback = ari.Playback();
        console.log('start playing ' + sound)
      return new Promise(function (resolve, reject) {
        playback.on('PlaybackFinished', function (event, playback) {
          resolve(playback);
        });

        channel.play({media: sound}, playback)
          .catch(function (err) {
              console.log(err)
            reject(err);
          });
      });
    }

    ari.start('hello');
  })
  .done(); // program will crash if it fails to connect
