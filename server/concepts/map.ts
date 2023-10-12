import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface MapDoc extends BaseDoc {
  locations: Array<ObjectId>;
  pins: Array<ObjectId>;
  currLocation?: ObjectId;
}

export default class MapConcept {
  public readonly maps = new DocCollection<MapDoc>("map");

  /**
   * Creates a new map object and adds to database
   */
  async createMap(currLocations?: Array<ObjectId>, currPins?: Array<ObjectId>, currLocation?: ObjectId) {
    // create new location
    let locations: ObjectId[] = new Array<ObjectId>();
    let pins: ObjectId[] = new Array<ObjectId>();
    if (currLocations !== undefined) {
      locations = currLocations;
    }
    if (currPins !== undefined) {
      pins = currPins;
    }
    
    const _id = await this.maps.createOne({ locations, pins, currLocation });

    const finalMap = await this.maps.readOne({ _id });

    if (finalMap === null) {
      throw new MapNotFoundError(_id);
    }

    return { msg: "Map successfully created!", map: finalMap };
  }

  /**
   * Removes a map object from the database
   */
  async sanitizeMap(_id: ObjectId) {
    await this.maps.deleteOne({ _id });
    return { msg: "Map deleted successfully!" };
  }

  /**
   * Returns all locations on given map, throw error if map doesn't exist
   */
  async getLocations(_id: ObjectId) {
    const map = await this.maps.readOne({ _id });
    if (map === null) {
      throw new MapNotFoundError(_id);
    } else {
      return { msg: "Locations found successfully", map: map };
    }
  }

  /**
   * Returns all pins on given map, throw error if map doesn't exist
   */
  async getPins(_id: ObjectId) {
    const map = await this.maps.readOne({ _id });
    if (map === null) {
      throw new MapNotFoundError(_id);
    } else {
      return { msg: "Pins found successfully", pins: map.pins };
    }
  }

  /**
   * Returns location that is currently selected on given map, throw error if map doesn't exist
   */
  async getCurrLocation(_id: ObjectId) {
    const map = await this.maps.readOne({ _id });
    if (map === null) {
      throw new MapNotFoundError(_id);
    } else {
      return { msg: "Current location found successfully", currLocation: map.currLocation };
    }
  }

  /**
   * Selects new location on map, or deselects location there is already a location selected
   * throws error if map does not exist
   */
  async selectLocation(_id: ObjectId, location: ObjectId) {
    const map = await this.maps.readOne({ _id });
    if (map === null) {
      throw new MapNotFoundError(_id);
    } else if (map.currLocation === undefined || map.currLocation === null) {
      this.maps.updateOne({ _id }, { currLocation: location });
      const finalMap = await this.maps.readOne({ _id });

      if (finalMap === null) {
        throw new MapNotFoundError(_id);
      }
      
      return { msg: "Location selected successfully", map: finalMap };
    } else {
      return await this.deselectLocation(_id);
    }
  }

  /**
   * Deselects location on map is a location is currently selected, throws error if map
   * does not exist
   */
  async deselectLocation(_id: ObjectId) {
    const map = await this.maps.readOne({ _id });
    if (map=== null) {
      throw new MapNotFoundError(_id);
    } else if (map.currLocation !== undefined && map.currLocation !== null) {
      this.maps.updateOne({ _id }, {currLocation: undefined});
      
      const finalMap = await this.maps.readOne({ _id });
      if (finalMap === null) {
        throw new MapNotFoundError(_id);
      }

      return { msg: "Location deselected successfully", map: finalMap };
    } else {
      return { msg: "Map has no location selected", map: map };
    }
  }

  /**
   * Adds a new pin to the map if it is not already on map, throws error if map doesn't exist
   */
  async addPin(_id: ObjectId, pin: ObjectId) {
    const map = await this.maps.readOne({ _id });
    if (map === null) {
      throw new MapNotFoundError(_id);
    }

    let pins = map.pins;

    if (pins.includes(pin)) {
      return { msg: "Pin already exists on map", map };
    }

    pins.push(pin);
    await this.maps.updateOne({ _id }, { pins: pins });

    const finalMap = await this.maps.readOne({ _id });
    if (finalMap === null) {
      throw new MapNotFoundError(_id);
    }

    await this.deselectLocation(_id);

    return { msg: "Pin successfully added", map: finalMap };
  }

  /**
   * Removes a pin from the map if it is on the map, throws error if map doesn't exist
   */
  async removePin(_id: ObjectId, pin: ObjectId) {
    const map = await this.maps.readOne({ _id });
    if (map === null) {
      throw new MapNotFoundError(_id);
    }

    let pins = map.pins;
    if (!pins.includes(pin)) {
      return { msg: "Map does not contain pin", map };
    }

    pins.splice(pins.indexOf(pin), 1);
    await this.maps.updateOne({ _id }, { pins: pins })

    const finalMap = await this.maps.readOne({ _id });
    if (finalMap === null) {
      throw new MapNotFoundError(_id);
    }
    return { msg: "Pin successfully removed", map: finalMap };
  }

  /**
   * Deselects location on map is a location is currently selected, throws error if map
   * does not exist
   */
  async getMap(_id: ObjectId) {
    const map = await this.maps.readOne({ _id });
    if (map === null) {
      throw new MapNotFoundError(_id);
    } 

    return { msg: "Map found successfully", map: map };
  }

}

export class MapNotFoundError extends NotFoundError {
  constructor(
    public readonly _id: ObjectId
  ) {
    super("Map {0} does not exist", _id);
  }
}