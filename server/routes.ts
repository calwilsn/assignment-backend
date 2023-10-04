import { Filter, ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Post, User, WebSession } from "./app";
import { PostAuthorNotMatchError, PostDoc } from "./concepts/post";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return (await User.getUsers(username))[0];
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  async getPosts(query: Filter<PostDoc>) {
    return await Post.read(query);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string) {
    const user = WebSession.getUser(session);
    return await Post.create(user, content);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    // Make sure the user deleting is the author of the post
    const sessionUser = WebSession.getUser(session);
    const post = await Post.posts.readOne({ _id });

    if (post === null) {
      throw new Error("post not found");
    }
    
    const postUser = post.author;
    
    if (postUser !== sessionUser) {
      throw new PostAuthorNotMatchError(postUser, sessionUser);
    }

    return await Post.delete(_id);
  }
  
  /*
  select or deselect a location on a map
  */
  @Router.patch("/map")
  async selectLocation(session: WebSessionDoc, location: ObjectId, map: ObjectId) {

  }

  /*
  add or remove a pin from the map
  */
  @Router.patch("/map")
  async addPin(session: WebSessionDoc, pin: ObjectId, map: ObjectId) {

  }

  /*
  get a location at given coordinates
  */
  @Router.get("/location")
  async getLocation(query: Filter<PostDoc>) {
    
  }

  /*
  Read pinpoints that meet given query
  */
  @Router.get("/pinpoints")
  async getPinPoints(query: Filter<PostDoc>) {

  }

  // What should be type of content?
  @Router.post("/pinpoints")
  async createPinPoint(session: WebSessionDoc, content: ObjectId, caption: string) {

  }

  /*
  Delete a pinpoint
  */
  @Router.delete("/pinpoints/:_id")
  async deletePinPoint(session: WebSessionDoc, _id: ObjectId) {
    
  }

  /*
  Read a collection
  */
  @Router.get("/collections")
  async getCollections(session: WebSessionDoc, _id: ObjectId) {

  }

  /*
  Create a new collection
  */
  @Router.post("/collection")
  async createCollection(session: WebSessionDoc, name: string) {

  }

  /*
  Create a new collection
  */
  @Router.patch("/collection")
  async addUser(session: WebSessionDoc, newUser: ObjectId) {

  }

  /*
  Create a new collection
  */
  @Router.patch("/collection")
  async addItem(session: WebSessionDoc, newItem: ObjectId) {

  }
}

export default getExpressRouter(new Routes());
