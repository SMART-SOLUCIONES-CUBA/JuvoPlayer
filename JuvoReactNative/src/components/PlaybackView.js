'use strict'
import React from 'react';
import {  
  View,
  Image,
  NativeModules,
  NativeEventEmitter,  
  Text
} from 'react-native';

import ResourceLoader from '../ResourceLoader';
import ContentDescription from  './ContentDescription';
import HideableView from './HideableView';
import PlaybackProgressBar from './PlaybackProgressBar';

export default class PlaybackView extends React.Component {
  constructor(props) {
    super(props);   
    this.curIndex = 0;
    this.playbackTimeCurrent = 0;    
    this.playbackTimeTotal = 0;     
    this.state = {        
        selectedIndex: 0
      };      
    this.visible =  this.props.visibility ? this.props.visibility : false;     
    this.keysListenningOff = false;    
    this.playerState = 'Idle';      
    this.bufferingInProgress = false;
    this.refreshInterval = -1;
    this.onScreenTimeOut = -1;    
    this.JuvoPlayer = NativeModules.JuvoPlayer;
    this.JuvoEventEmitter = new NativeEventEmitter(this.JuvoPlayer);
    this.onTVKeyDown = this.onTVKeyDown.bind(this);  
    this.onTVKeyUp = this.onTVKeyUp.bind(this);
    this.rerender = this.rerender.bind(this);
    this.toggleView = this.toggleView.bind(this);
    this.onPlaybackCompleted = this.onPlaybackCompleted.bind(this);
    this.onPlayerStateChanged = this.onPlayerStateChanged.bind(this);
    this.onUpdateBufferingProgress = this.onUpdateBufferingProgress.bind(this);
    this.onUpdatePlayTime = this.onUpdatePlayTime.bind(this);
    this.resetPlaybackTime = this.resetPlaybackTime.bind(this);      
    this.onSeek = this.onSeek.bind(this);  
    this.onPlaybackError = this.onPlaybackError.bind(this);
    this.handleFastForwardKey = this.handleFastForwardKey.bind(this);
    this.handleRewindKey = this.handleRewindKey.bind(this);
    this.getFormattedTime = this.getFormattedTime.bind(this);
    this.handlePlaybackInfoDisappeard = this.handlePlaybackInfoDisappeard.bind(this);
    this.showPlaybackInfo = this.showPlaybackInfo.bind(this);
    this.stopPlaybackTime = this.stopPlaybackTime.bind(this);
    this.refreshPlaybackInfo = this.refreshPlaybackInfo.bind(this);
    this.setIntervalImmediately = this.setIntervalImmediately.bind(this);
    
  }
  getFormattedTime(milisecs) {  
    var seconds = parseInt((milisecs/1000)%60)
    var minutes = parseInt((milisecs/(1000*60))%60)
    var hours = parseInt((milisecs/(1000*60*60))%24);
    return "%hours:%minutes:%seconds"
      .replace('%hours', hours.toString().padStart(2, '0'))
      .replace('%minutes', minutes.toString().padStart(2, '0'))
      .replace('%seconds', seconds.toString().padStart(2, '0'))      
  }  
  componentWillMount() {
    this.JuvoEventEmitter.addListener(
      'onTVKeyDown',
      this.onTVKeyDown
    );   
    this.JuvoEventEmitter.addListener(
      'onTVKeyUp',
      this.onTVKeyUp
    ); 
    this.JuvoEventEmitter.addListener(
      'onPlaybackCompleted',
      this.onPlaybackCompleted
    );
    this.JuvoEventEmitter.addListener(
      'onPlayerStateChanged',
      this.onPlayerStateChanged
    );
    this.JuvoEventEmitter.addListener(
      'onUpdateBufferingProgress',
      this.onUpdateBufferingProgress
    );
    this.JuvoEventEmitter.addListener(
      'onUpdatePlayTime',
      this.onUpdatePlayTime
    );
    this.JuvoEventEmitter.addListener(
      'onSeek',
      this.onSeek
    );      
    this.JuvoEventEmitter.addListener(
      'onPlaybackError',
    this.onPlaybackError
    );  
  }  
  shouldComponentUpdate(nextProps, nextState) { 
      return true; 
  }
  toggleView() {   
    this.visible = !this.visible;    
    this.props.switchView('PlaybackView', this.visible);  
  }   
  handleFastForwardKey() {        
    if (this.playerState =='Paused') return; 
    this.JuvoPlayer.forward();
  }
  handleRewindKey() {     
    if (this.playerState =='Paused') return;      
    this.JuvoPlayer.rewind();
  }
  handlePlaybackInfoDisappeard() {     
    this.stopPlaybackTime(); 
    this.rerender();
  }
  onPlaybackCompleted(param) {         
    this.toggleView();
  }
  onPlayerStateChanged(player) {  
    if ( player.State === 'Playing') {   
      this.showPlaybackInfo();
    }   
    if (player.State === 'Idle') {     
      this.resetPlaybackTime();  
      this.rerender();  
    }  
    this.playerState = player.State;  
  }
  onUpdateBufferingProgress(buffering) {     
      if (buffering.Percent == 100) {
        this.bufferingInProgress = false;        
      } else {
        this.JuvoPlayer.log("Buffering" + buffering.Percent);
        this.bufferingInProgress = true;        
      }
  }
  onUpdatePlayTime(playtime) {   
    this.playbackTimeCurrent = parseInt(playtime.Current);
    this.playbackTimeTotal = parseInt(playtime.Total);   
  }
  onSeek(time) { 
    this.JuvoPlayer.log("onSeek time.to = " + time.to);
  }
  onPlaybackError(error) {
    this.JuvoPlayer.log("onPlaybackError message = " + error.Message);
    this.toggleView(); 
  }
  onTVKeyDown(pressed) {
    //There are two parameters available:
    //params.KeyName
    //params.KeyCode      
    if (this.keysListenningOff) return;  
    this.showPlaybackInfo();  
    const video = ResourceLoader.clipsData[this.props.selectedIndex];
    switch (pressed.KeyName) {
      case "Right":         
        this.handleFastForwardKey(); 
        break;
      case "Left":    
        this.handleRewindKey();  
        break;
      case "Return":
      case "XF86AudioPlay":
      case "XF86PlayBack":  
        if (this.playerState === 'Idle') {                  
          let licenseURI = video.drmDatas ? video.drmDatas[0].licenceUrl : null;
          let DRM = video.drmDatas ? video.drmDatas[0].scheme : null;          
          this.JuvoPlayer.startPlayback(video.url, licenseURI, DRM, video.type);                          
        }
        if (this.playerState === 'Paused' || this.playerState === 'Playing') {
          //pause - resume                            
          this.JuvoPlayer.pauseResumePlayback(); 
        }                
        break;        
      case "XF86Back":
      case "XF86AudioStop":            
        this.JuvoPlayer.stopPlayback();       
        this.toggleView();         
    }       
  }
  onTVKeyUp(pressed) {
    if (this.keysListenningOff) return; 
    this.showPlaybackInfo(); 
  }
  showPlaybackInfo() {               
    this.stopPlaybackTime();  
    this.refreshPlaybackInfo();   
  }
  resetPlaybackTime() {
    this.playbackTimeCurrent = 0;
    this.playbackTimeTotal = 0; 
  }
  stopPlaybackTime() {   
    if (this.refreshInterval >= 0) {      
      clearInterval(this.refreshInterval);
      this.refreshInterval = -1;
      clearTimeout(this.onScreenTimeOut);
      this.onScreenTimeOut = -1;      
    }  
  }
  refreshPlaybackInfo() {   
    this.onScreenTimeOut = setTimeout(this.handlePlaybackInfoDisappeard, 10000);
    this.refreshInterval = this.setIntervalImmediately(this.rerender, 1000); 
  }
  setIntervalImmediately(func, interval) {
    func();
    return setInterval(func, interval);
  }
  rerender() {     
    this.setState({selectedIndex: this.state.selectedIndex});    
  }
  render() {    
    const index = this.props.selectedIndex; 
    const title = ResourceLoader.clipsData[index].title;    
    const fadeduration = 300;
    const revIconPath = ResourceLoader.playbackIconsPathSelect('rew');
    const ffwIconPath = ResourceLoader.playbackIconsPathSelect('ffw');
    const settingsIconPath = ResourceLoader.playbackIconsPathSelect('set');   
    const playIconPath = this.playerState !== 'Playing' ? ResourceLoader.playbackIconsPathSelect('play') : ResourceLoader.playbackIconsPathSelect('pause');
    const visibility = this.props.visibility ? this.props.visibility : this.visible;   
    this.visible = visibility;
    this.keysListenningOff  = !visibility;        
    const total = this.playbackTimeTotal;
    const current = this.playbackTimeCurrent;   
    const playbackTime = total > 0 ?  current / total : 0;    
    const progress = Math.round((playbackTime) * 100 ) / 100;      
    return (
      <View style={{ top: -2680, left: 0, width: 1920, height: 1080}}>
           <HideableView visible={visibility} duration={fadeduration}>    
              <HideableView visible={this.onScreenTimeOut >= 0} duration={fadeduration}>     
                    <ContentDescription viewStyle={{ top: 0, left: 0, width: 1920, height: 250, justifyContent: 'center', alignSelf: 'center', backgroundColor: '#000000', opacity: 0.8}} 
                                            headerStyle={{ fontSize: 60, color: '#ffffff', alignSelf: 'center', opacity: 1.0}} bodyStyle={{ fontSize: 30, color: '#ffffff', top: 0}} 
                                            headerText={title} bodyText={''}/>
                     <Image resizeMode='cover' 
                          style={{ width: 70 , height: 70, top: -180, left: 1800}} 
                          source={settingsIconPath} 
                        /> 
                    <View style={{ top: 530, left: 0, width: 1920, height: 760,  justifyContent: 'center', alignSelf: 'center', backgroundColor: '#000000', opacity: 0.8}}>
                        <PlaybackProgressBar value={progress}  color="green" />
                        <Image resizeMode='cover' 
                            style={{ width: 70 , height: 70, top: -130, left: 70}} 
                            source={revIconPath} 
                        />
                        <Image resizeMode='cover' 
                            style={{ width: 70 , height: 70, top: -200, left: 930}} 
                            source={playIconPath} 
                        />  
                        <Image resizeMode='cover' 
                            style={{ width: 70 , height: 70, top: -270, left: 1780}} 
                            source={ffwIconPath} 
                        />
                         <Text style={{width: 150 , height: 30, top: -380, left: 60, fontSize: 30, color: '#ffffff' }} >
                            {this.getFormattedTime(this.playbackTimeCurrent)}
                        </Text>
                        <Text style={{width: 150 , height: 30, top: -410, left: 1760, fontSize: 30, color: '#ffffff' }} >
                            {this.getFormattedTime(this.playbackTimeTotal)}
                        </Text>                        
                    </View>                    
              </HideableView>
          </HideableView>                                       
      </View>
    );
  }
}