import React from 'react';
import {BrowserRouter as Router} from 'react-router-dom'
function App() {
  return (
    <div className="App">
      <Router>
      <Switch>
              <Route exact path="/register" component={Register} />
              <Route path="/login" component={Login} />
              <Route path="/search" component={Search} />
              <Route path="/profiles" component={Profiles} />
              <Route path="/follow" component={Follow} />
              <Route path="/tweet" component={Create} />
             
            </Switch>
      </Router>
       
    </div>
  );
}

export default App;
