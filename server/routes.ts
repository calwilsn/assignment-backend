import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Collection, Location, Map, Pin, PinPoint, User, WebSession } from "./app";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";

class Routes {
  /**
   * Find the current user associated with the session
   **/
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getById(user);
  }

  /**
   * Returns all users
   **/
  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  /**
   * Finds exactly one user with given username
   */
  @Router.get("/users/:username")
  async getUser(username: string) {
    return (await User.getUsers(username))[0];
  }

  /**
   * Creates a new user with given username
   */
  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  /**
   * Applies filter to update user currently logged in
   */
  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  /**
   * Logs in user with given username and password
   */
  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  /**
   * Logs out currently active user
   */
  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  // @Router.get("/posts")
  // async getPosts(query: Filter<PostDoc>) {
  //   return await Post.read(query);
  // }

  // @Router.post("/posts")
  // async createPost(session: WebSessionDoc, content: string) {
  //   const user = WebSession.getUser(session);
  //   return await Post.create(user, content);
  // }

  // @Router.delete("/posts/:_id")
  // async deletePost(session: WebSessionDoc, _id: ObjectId) {
  //   // Make sure the user deleting is the author of the post
  //   const sessionUser = WebSession.getUser(session);
  //   const post = await Post.posts.readOne({ _id });

  //   if (post === null) {
  //     throw new Error("post not found");
  //   }
    
  //   const postUser = post.author;
    
  //   if (postUser !== sessionUser) {
  //     throw new PostAuthorNotMatchError(postUser, sessionUser);
  //   }

  //   return await Post.delete(_id);
  // }
  
  /**
   * Creates new map
   */
  @Router.post("/map")
  async createMap(locations?: Array<ObjectId>, pins?: Array<ObjectId>, currLocation?: ObjectId) {
    return await Map.createMap(locations, pins, currLocation);
  }


  /**
   * Select or deselect coordinates on the map and create a new location there if
   * it does not already exist
  */
  @Router.patch("/map/:mapid/:x/:y")
  async selectLocation(session: WebSessionDoc, mapid: ObjectId, x: number, y: number) {
    const location = (await (Location.createLocation(x, y))).location;
    return await Map.selectLocation(mapid, location._id);
  }

  /**
   * Create new pin at current location and add to map
   */
  @Router.patch("/map/pin/:mapid")
  async dropPin(session: WebSessionDoc, mapid: ObjectId) {
    const user = WebSession.getUser(session);
    const currLocation = (await Map.getCurrLocation(mapid)).currLocation;
    if (currLocation === undefined) {
      return { msg: "Cannot drop Pin at undefined location" };
    }
    const pin = (await Pin.dropPin(user, currLocation)).pin;
    return await Map.addPin(mapid, pin._id);
  }

  /**
   * Remove pin from map
   */
  @Router.delete("/map/pin/:mapid/:pinid")
  async removePin(session: WebSessionDoc, mapid: ObjectId, pinid: ObjectId) {
    const user = WebSession.getUser(session);
    await Map.removePin(mapid, pinid);
    return await Pin.sanitizePin(pinid, user);
  }

  /**
   * Read pinpoints for currentuser
   */
  @Router.get("/pinpoints/user")
  async getPinPoints(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await PinPoint.read({ user });
  }

  /**
   * Creates a new PinPoint with given content and caption
   */
  @Router.post("/pinpoints/new/:pin/:content/:caption")
  async createPinPoint(session: WebSessionDoc, pin: ObjectId, content: string, caption?: string) {
    const user = WebSession.getUser(session);
    return await PinPoint.makePost(pin, content, caption, user);
  }

  /**
   * Edits the caption of an existing pinpoint
   */
  @Router.patch("/pinpoints/edit/:pinpointid/:caption")
  async editCaption(session: WebSessionDoc, pinpointid: ObjectId, caption: string) {
    const user = WebSession.getUser(session);
    return await PinPoint.editCaption(pinpointid, caption);
  }

  /**
   * Delete a pinpoint
   */
  @Router.delete("/pinpoints/user/:_id")
  async deletePinPoint(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    return await PinPoint.deletePost(_id, user)
  }

  /**
   * Get all collections accessible by user
   */
  @Router.get("/collection")
  async getAllCollections(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Collection.read({ users: user });
  }

  /**
   * Search for a collection by name
   */
  @Router.get("/collection/:name")
  async getCollection(session: WebSessionDoc, name: string) {
    const user = WebSession.getUser(session);
    return await Collection.getCollectionByName(name, user);
  }

  /**
   * Create a new collection
   */
  @Router.post("/collection/new/:name")
  async createCollection(session: WebSessionDoc, name: string) {
    const user = WebSession.getUser(session);
    return await Collection.create(user, name);
  }

  /**
   * Adds a pin to a collection
   */
  @Router.patch("/collection/:name/pins/:pinid")
  async addPinToCollection(session: WebSessionDoc, name: string, pinid: ObjectId) {
    const user = WebSession.getUser(session);
    const collection = (await Collection.getCollectionByName(name, user)).collection;
    console.log(collection.users);
    await Pin.getPinById(pinid); // throw error if pin does not exist
    return await Collection.addPin(collection._id, user, pinid);
  }

  /**
   * Gives a new user access to a collection
   */
  @Router.patch("/collection/:name/users/:username")
  async giveAccessToCollection(session: WebSessionDoc, name: string, username: string) {
    const user = WebSession.getUser(session);
    const newUser = await User.getUserByUsername(username);

    const collection = (await Collection.getCollectionByName(name, user)).collection;
    return await Collection.addUser(collection._id, user, newUser._id);
  }
}

export default getExpressRouter(new Routes());
