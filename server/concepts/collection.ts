import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface CollectionDoc extends BaseDoc {
  name: string;
  users: Array<ObjectId>;
  pins: Array<ObjectId>;
}

export default class CollectionConcept {
  public readonly collections = new DocCollection<CollectionDoc>("collections");

  async create(user: ObjectId, name: string) {
    await this.canCreate(name);
    let users = new Array<ObjectId>(user);
    let pins = new Array<ObjectId>();
    const _id = await this.collections.createOne({ name, users, pins });
    return { msg: "Collection successfully created", collection: await this.collections.readOne({ _id }) };
  }

  private async canAccess(_id: ObjectId, user: ObjectId) {
    const collection = (await this.collections.readOne({ _id }));
    if (collection === null) {
      throw new CollectionNotFoundError(`Collection with id ${_id} does not exist`);
    }
    if (collection.users.indexOf(user) === -1) {
      throw new NotAllowedError(`User with id ${_id} cannot access this collection`)
    }
    return { msg: "User can access collection", collection: collection };
  }

  async addUser(_id: ObjectId, currUser: ObjectId, newUser: ObjectId) {
    const currCollection = (await this.canAccess(_id, currUser)).collection;
    const newUsers = currCollection.users;
    newUsers.push(newUser);
    await this.collections.updateOne({ _id }, { users: newUsers});
    const finalCollection = await this.collections.readOne({ _id });
    if (finalCollection === null) {
      throw new NotFoundError("Could not access collection");
    }
    return { msg: "Collection updated successfully", collection: finalCollection };
  }

  async addPin(_id: ObjectId, currUser: ObjectId, pin: ObjectId) {
    const currCollection = (await this.canAccess(_id, currUser)).collection;
    const newPins = currCollection.pins;
    newPins.push(pin);
    await this.collections.updateOne({ _id }, { pins: newPins});
    return { msg: "Collection updated successfully", collection: await this.collections.readOne({ _id }) };
  }

  async read(query: Filter<CollectionDoc>) {
    const collections = await this.collections.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return collections;
  }

  async delete(_id: ObjectId, currUser: ObjectId) {
    await this.canAccess(_id, currUser);
    await this.collections.deleteOne({ _id });
    return { msg: "Collection deleted successfully" };
  }

  async getCollectionByName(name: string, currUser: ObjectId) {
    const collection = await this.collections.readOne({ name });
    if (collection === null) {
      throw new CollectionNotFoundError(`No collection with name ${name} exists`);
    }
    await this.canAccess(collection._id, currUser);
    return { msg: "Collection found successfully", collection: collection };
  }

  private async isNameUnique(name: string) {
    if (await this.collections.readOne({ name })) {
      throw new NotAllowedError(`Collection with name ${name} already exists`);
    }
  }

  private async canCreate(name: string) {
    if (!name) {
      throw new BadValuesError("Name of collection must be non-empty");
    }
    return await this.isNameUnique(name);
  }
}

/**
 * Corresponds to an action that attempts to access a collection that does not exist
 */
export class CollectionNotFoundError extends NotFoundError {
  public readonly HTTP_CODE = 404;
}
