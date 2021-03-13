<https://sequelize.org/v4/manual/tutorial/migrations.html>

# web-chat-application-server

Follwing the 'Node.js and React: Build a complete web chat application' Udemy course.

##

### Chat model

sequelize model:create --name Chat --attributes type:string

### ChatUser model

sequelize model:create --name ChatUser --attributes chatId:integer,userId:integer

### Message model

sequelize model:create --name Message --attributes type:string,message:text,chatId:integer,fromUserId:integer

### Migrate

sequelize db:migrate

### Chat seeder file

sequelize seed:create --name chats

sequelize db:seed --seed [filename]

sequelize db:seed --seed 20210313182502-chats
