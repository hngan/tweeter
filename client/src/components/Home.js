import React from 'react'
import {Link} from 'react-router-dom'
export default class Home extends React.Component{

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