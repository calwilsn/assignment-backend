import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotFoundError } from "./errors";

export interface PinPointDoc extends BaseDoc {
 pin: ObjectId;
 media: String; // represent media as URL that can me displayed later in front end
 caption?: String;
 user?: ObjectId;
}

export default class PinPointConcept {
    public readonly pinpoints = new DocCollection<PinPointDoc>("pinpoints");

    async makePost(pin: ObjectId, media: String, caption?: String, user?: ObjectId) {
        const _id = await this.pinpoints.createOne({ pin, media, caption, user });
        const pinpoint = await this.pinpoints.readOne({ _id });
        if (pinpoint === null) {
            throw new BadValuesError("Could not create PinPoint");
        }
        return { msg: "PinPoint successfully created", pinpoint: pinpoint };
    }

    async deletePost(_id: ObjectId, user?: ObjectId) {
        const pinpoint = await this.pinpoints.readOne({ _id });
        if (pinpoint === null) {
            throw new NotFoundError("No such PinPoint exists");
        }
        if (pinpoint.user === null || pinpoint.user === undefined || pinpoint.user === user) {
            await this.pinpoints.deleteOne({ _id });
            return { msg: "PinPoint deleted successfully" };
        } 

        return { msg: "Could not delete PinPoint" };
    }

    async editCaption(_id: ObjectId, newCaption: String, userid?: ObjectId) {
        const pinpoint = await this.pinpoints.readOne({ _id });
        if (pinpoint === null) {
            throw new NotFoundError(`No PinPoint with id ${_id} exists`)
        }
        if (pinpoint.user === undefined || pinpoint.user === null || pinpoint.user === userid) {
            await this.pinpoints.updateOne({ _id }, { caption : newCaption});

            return { msg: "Caption updated successfully" };
          }
        return { msg: "Could not update caption" };
    }

    async read(query: Filter<PinPointDoc>) {
        const pinpoints = await this.pinpoints.readMany(query, {
        sort: { dateUpdated: -1 },
        });
        return pinpoints;
    }
}