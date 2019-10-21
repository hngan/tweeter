import React from 'react'
import {Link} from 'react-router-dom'
export default class Login extends React.Component{
    state={
        signup: false,
        verify: false,
        username: "",
        password: "",
        email : "",
        key: "",
    }
    componentDidMount(){

    }
    render(){
        return(
            <div>
               <h1>Sign Up</h1>
               <input placeholder="username"/>
               <input placeholder="email"/>
               <input placeholder="password"/>
            </div>
        )
    }
}