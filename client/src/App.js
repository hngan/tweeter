import React from 'react';
import Welcome from './components/Welcome'
import Login from './components/Login'
import Home from  './components/Home'
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
function App() {
  return (
   <div className = "App">
     <Router>
       <Switch>
         <Route exact path='/' component= {Welcome}/>
         <Route exact path='/login' component= {Login}/>
         <Route exact path='/Home' component= {Home}/>
       </Switch>
     </Router>
  </div>
  );
}

export default App;
