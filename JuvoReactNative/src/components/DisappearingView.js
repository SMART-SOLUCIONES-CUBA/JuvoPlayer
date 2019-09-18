'use strict'
import React, { Component, PropTypes } from 'react';
import {  
  View,  
  Animated,
  NativeModules  
} from 'react-native'

export default class DisappearingView extends Component {   
    constructor(props) {
      super(props);
      this.state = {
        opacity: new Animated.Value(1)
      }
      this.animationInProgress = false;
      this.handleDisappeared = this.handleDisappeared.bind(this);
      this.JuvoPlayer = NativeModules.JuvoPlayer;
           
    }
    handleDisappeared() {
      this.animationInProgress = false;
      this.props.onDisappeared();
    }  
    animate(show) {            
      if (!this.animationInProgress) {
        const duration = this.props.duration ? parseInt(this.props.duration) : parseInt(500);
        const timeOnScreen = this.props.timeOnScreen ? parseInt(this.props.timeOnScreen) : parseInt(5000); // default on screen time       
        this.animationInProgress = true; 
        Animated.sequence([        
          Animated.timing(
              this.state.opacity, {
                toValue: show ? 1 : 0,
                duration: !this.props.noAnimation ? duration : 0
              }
              ),
          Animated.delay(timeOnScreen),            
          Animated.timing(
            this.state.opacity, {
              toValue: 0,
              duration: !this.props.noAnimation ? duration : 0            
            }              
          )
          ]).start(this.handleDisappeared);    
        }           
    }
    componentWillUpdate(nextProps, nextState) {   
      this.state.opacity.stopAnimation();          
      this.animate(1);      
    }           
    render() {  
      return (
        <View>
          <Animated.View style={{ opacity: this.state.opacity }}>
            {this.props.children}
          </Animated.View>
        </View>
      )
    }
  }
  
  DisappearingView.propTypes = {    
    timeOnScreen: PropTypes.number,
    duration: PropTypes.number,
    removeWhenHidden: PropTypes.bool,
    noAnimation: PropTypes.bool
  }