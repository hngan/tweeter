import axios from "axios";

export default {
  addUser: function(userData) {
    return axios.post("/adduser", userData);
	},

  login: function(credentials) {
    return axios.post("/login", credentials);
  },
	logout: function() {
    return axios.post("/logout");
  },
	verify: function(credentials){
		return axios.post("/verify", credentials);
	},
	addItem:function(){

	},
	getItem: function(id){
		return axios.get("/item/"+id);
	},
	search: function(){

	}
};