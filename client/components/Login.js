import React from 'react'
import Link from 'react-router-dom'
export default class Welcome extends React.Component{
    state={
        signup = false,
        verify = false,
        username = "",
        password = "",
        email = "",
        key = ""
    }
    componentDidMount(){

    }
    render(){
        return(
            <div>
                Twitter Clone Project
                <Link to="/Login">
                <button>Get Started</button>
                </Link>           
            </div>
        )
    }
}