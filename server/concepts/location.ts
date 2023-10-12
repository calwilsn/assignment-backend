import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { DoesNotExistError, NotFoundError } from "./errors";

export interface LocationDoc extends BaseDoc {
  x: number;
  y: number;
  name?: string;
}

export default class LocationConcept {
  public readonly locations = new DocCollection<LocationDoc>("location");

  /**
   * Returns location at coordinates (x, y) if it exists, else creates a new
   * location at given coordinates
   */
  async createLocation(x: number, y: number, name?: string) {
    // first ensure that location does not already exist
    const prevLocation = await this.getLocationByCoordinates(x, y);
    if (prevLocation !== null) {
      return { msg: "Location already exists!", location: prevLocation };
    }
    
    // create new location
    const _id = await this.locations.createOne({ x, y, name });
    const location = await this.locations.readOne({ _id });
    if (location === null) {
      throw new LocationNotFoundError(_id);
    } else {
      return { msg: "Location successfully created!", location: location };
    }
  }

  /**
   * Deletes location from database
   */
  async sanitizeLocation(_id: ObjectId) {
    await this.locations.deleteOne({ _id });
    return { msg: "Location deleted successfully!" };
  }

  /**
   * Finds name of given location, throws error if location does not
   * exist, or if the location does not have a name
   */
  async getName(_id: ObjectId) {
    const location = await this.locations.readOne({ _id });
    if (location === null) {
      throw new LocationNotFoundError(_id);
    } else if (location.name === undefined) {
      return { msg: "Location does not have a name", name: location.name };
    } else {
      return { msg: "Name found successfully", name: location.name };
    }
  }

  /**
   * Returns location at given coordinates, throws error if location does
   * not exist
   */
  async getCoordinates(_id: ObjectId) {
    const location = await this.locations.readOne({ _id });
    if (location === null) {
      throw new LocationNotFoundError(_id);
    } else {
      return { msg: "Coordinates found successfully", x: location.x, y: location.y};
    }
  }

  /**
   * Finds all locations that fit query
   */
  async getLocations(query: Filter<LocationDoc>) {
    const locations = await this.locations.readMany(query);
    return locations;
  }

  /**
   * Finds location at given coordinates, if it exists
   */
  async getLocationByCoordinates(x: number, y: number) {
    // only one location can exist at each unique pair of coordinates
    const location = await this.locations.readOne({x: x, y: y});
    return location;
  }

  /**
   * Finds location at given coordinates, if it exists
   */
  async getLocationsByName(name: string) {
    const locations = await this.locations.readMany({name: name});
    return locations;
  }
}

export class LocationNotFoundError extends NotFoundError {
  constructor(
    public readonly _id: ObjectId
  ) {
    super("Location {0} does not exist", _id);
  }
}
export class NameDoesNotExistError extends DoesNotExistError {
  constructor(
    public readonly _id: ObjectId
  ) {
    super("Location {0} does not have a name", _id);
  }
}