import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface CollectionDoc extends BaseDoc {
  name: string;
  users: Array<ObjectId>; // is this the correct way to do this ???
  pins: Array<ObjectId>;
}

export default class PostConcept {
  public readonly collections = new DocCollection<CollectionDoc>("collections");

  async create(user: ObjectId, name: string) {
    let users = new Array<ObjectId>(user);
    let pins = new Array<ObjectId>();
    const _id = await this.collections.createOne({ name, users, pins });
    return { collections: "Collection successfully created!", collection: await this.collections.readOne({ _id }) };
  }

  async addUser(_id: ObjectId, user: ObjectId) {
    const currCollection = await this.collections.readOne({ _id });
    if (currCollection === null) {
      throw new CollectionNotFoundError(`Collection with id ${_id} does not exist`);
    }
    const newUsers = currCollection.users;
    newUsers.push(user);
    const update: Partial<CollectionDoc> = { users: newUsers};
    await this.collections.updateOne({ _id }, update);
  }

  async addPin(_id: ObjectId, pin: ObjectId) {
    const currCollection = await this.collections.readOne({ _id });
    if (currCollection === null) {
      throw new CollectionNotFoundError(`Collection with id ${_id} does not exist`);
    }
    const newPins = currCollection.pins;
    newPins.push(pin);
    const update: Partial<CollectionDoc> = { pins: newPins};
    await this.collections.updateOne({ _id }, update);
  }

  async read(query: Filter<CollectionDoc>) {
    const collections = await this.collections.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return collections;
  }

  async delete(_id: ObjectId) {
    await this.collections.deleteOne({ _id });
    return { msg: "Post deleted successfully!" };
  }
}

/**
 * Corresponds to an action that attempts to access a collection that does not exist
 */
export class CollectionNotFoundError extends NotFoundError {
  public readonly HTTP_CODE = 404;
}