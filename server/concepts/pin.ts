import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, DoesNotExistError, NotFoundError } from "./errors";

export interface PinDoc extends BaseDoc {
  location?: ObjectId;
  user?: ObjectId;
}

export default class PinConcept {
  public readonly pins = new DocCollection<PinDoc>("pin");

  /**
   * Creates a new pin at the given location
   */
  async dropPin(user?: ObjectId, location?: ObjectId) {
    const oldPin = await this.pins.readOne({ location })
    if (oldPin !== null) {
      return {msg: "Pin already exists at this location", pin: oldPin};
    }
    
    const _id = await this.pins.createOne({ location, user });
    const pin = await this.pins.readOne({ _id });
    if (pin === null) {
      throw new BadValuesError("Could not create pin");
    }
    return { msg: "Pin successfully created", pin: pin };
  }

  /**
   * Deletes a pin from the database
   */
  async sanitizePin(_id: ObjectId, user?: ObjectId) {
    const pin = await this.pins.readOne({ _id });

    if (pin === null) {
      return { msg: "No such pin exists" };
    }

    if (pin.user === undefined || pin.user === null || pin.user === user) {
      await this.pins.deleteOne({ _id });
      return { msg: "Pin deleted successfully" };
    }

    return { msg: "User does not have access to pin" };
  }

  /**
   * Finds the location associated with a pin, throws error if no such pin exists
   * or if the pin does not have a location
   */
  async getLocation(_id: ObjectId) {
      const pin = await this.pins.readOne({ _id });
      if (pin === null) {
        throw new PinNotFoundError(_id);
      } else if (pin.location === undefined) {
        throw new LocationDoesNotExistdError(_id);
      }
      return { msg: "Location found successfully", location: pin.location };
  }

  /**
   * Finds a pin by id, throws error if no such pin exists
   */
  async getPinById(_id: ObjectId) {
    const pin = await this.pins.readOne({ _id });
    if (pin === null) {
      throw new PinNotFoundError(_id);
    }
    return pin;
  }
}

export class PinNotFoundError extends NotFoundError {
  constructor(
    public readonly _id: ObjectId
  ) {
    super("Pin {0} does not exist", _id);
  }
}
export class LocationDoesNotExistdError extends DoesNotExistError {
  constructor(
    public readonly _id: ObjectId
  ) {
    super("Pin {0} does not have a location", _id);
  }
}