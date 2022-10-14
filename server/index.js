const express = require("express");
const app = express();
const PORT = 4000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const http = require("http").Server(app);
const cors = require("cors");

app.use(cors());

const socketIO = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:3000"
    }
});

let todoList = [];

socketIO.on("connection", (socket) => {
    console.log(`⚡: ${socket.id} user just connected!`);

    socket.on("addTodo", (todo) => {
        console.log(todo)
        //👇🏻 Adds the to-do object to the list of to-dos
        todoList.unshift(todo);
        //👇🏻 Sends all the to-dos to the React app
        socket.emit("todos", todoList);
    });

    socket.on("deleteTodo", (id) => {
        todoList = todoList.filter((todo) => todo.id !== id);
        //👇🏻 Sends the updated to-do to the React app
        socket.emit("todos", todoList);
    });

    socket.on("viewComments", (id) => {
        for (let i = 0; i < todoList.length; i++) {
            if (id === todoList[i].id) {
                
                //👇🏻 sends the todo details back to the React app for display
                socket.emit("commentsReceived", todoList[i]);
            }
        }
    });

    socket.on("updateComment", (data) => {
        //👇🏻 Destructure the items from the object
        const { user, todoID, comment } = data;
    
        for (let i = 0; i < todoList.length; i++) {
            //👇🏻 Gets the todo
            if (todoID === todoList[i].id) {
                //👇🏻 Add the comment to the list of comments
                todoList[i].comments.push({ name: user, text: comment });
                //👇🏻 Sends an update to React app
                socket.emit("commentsReceived", todoList[i]);
            }
        }
    });

    socket.on("disconnect", () => {
        socket.disconnect();
        console.log("🔥: A user disconnected");
    });
});

app.get("/api", (req, res) => {
    res.json(todoList);
});

http.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});