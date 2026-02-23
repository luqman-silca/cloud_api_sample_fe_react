export const CURRENT_CONFIG = {

  // license
  appId: '170765', // You need to go to the development website to apply.
  appKey: '40270261aef1d87923591e9f4ba4213', // You need to go to the development website to apply.
  appLicense: 'pF2oAGqPluqsMZAASL5/PTWyZ15CSTYXEZMeaESnWuRbx+7BXwpzwGVkhORLlG0emcGGuBlJ029+mA4wBjzYjUJb1o8t8dlpeW20KGUneEulZP8fi+gq2qyBNqSUKDHT2PumFKakdgbi+iaOjAA0y831VFywHF7LX/vudLWRrpU=', // You need to go to the development website to apply.

  // http
  baseURL: 'http://10.80.0.147:3001/v1/', // NestJS backend URL (compatibility layer provides Java-style routes at /manage/api/v1, /wayline/api/v1, etc.)
  websocketURL: 'ws://10.80.0.147:3001/api/v1/ws', // STOMP WebSocket URL for DJI Pilot app (matches Java backend)

  // livestreaming
  // RTMP  Note: This IP is the address of the streaming server. If you want to see livestream on web page, you need to convert the RTMP stream to WebRTC stream.
  rtmpURL: 'Please enter the rtmp access address.', // Example: 'rtmp://192.168.1.1/live/'
  // GB28181 Note:If you don't know what these parameters mean, you can go to Pilot2 and select the GB28181 page in the cloud platform. Where the parameters same as these parameters.
  gbServerIp: 'Please enter the server ip.',
  gbServerPort: 'Please enter the server port.',
  gbServerId: 'Please enter the server id.',
  gbAgentId: 'Please enter the agent id',
  gbPassword: 'Please enter the agent password',
  gbAgentPort: 'Please enter the local port.',
  gbAgentChannel: 'Please enter the channel.',
  // RTSP
  rtspUserName: 'Please enter the username.',
  rtspPassword: 'Please enter the password.',
  rtspPort: '8554',
  // Agora
  agoraAPPID: 'Please enter the agora app id.',
  agoraToken: 'Please enter the agora temporary token.',
  agoraChannel: 'Please enter the agora channel.',

  // map
  // You can apply on the AMap website.
  amapKey: 'Please enter the amap key.',
}
