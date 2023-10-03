import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface PinPointDoc extends BaseDoc {
 pin: ObjectId;
 user: ObjectId;
 caption: String;
 media: ObjectId;
}

export default class PostConcept {
    public readonly pinpoints = new DocCollection<PinPointDoc>("pinpoints");

    async makePost(pin: ObjectId, user: ObjectId, caption: String, media: ObjectId) {
        const _id = await this.pinpoints.createOne({ pin, user, caption, media });
        return { msg: "PinPoint successfully created!", pinpoint: await this.pinpoints.readOne({ _id }) };
    }

    async deletePost(_id: ObjectId) {
        await this.pinpoints.deleteOne({ _id });
        return { msg: "PinPoint deleted successfully!" };
    }

    async editCaption(_id: ObjectId, newCaption: String) {
        const update: Partial<PinPointDoc> = { caption : newCaption};
        await this.pinpoints.updateOne({ _id }, update);
    }

    async read(query: Filter<PinPointDoc>) {
        const pinpoints = await this.pinpoints.readMany(query, {
        sort: { dateUpdated: -1 },
        });
        return pinpoints;
    }
  }