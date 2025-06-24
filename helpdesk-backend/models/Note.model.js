import mongoose from "mongoose"

const noteSchema = new mongoose.Schema(
    {
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: [true, "Note content is required"],
        },
    },
    {
        timestamps: true,
    }
)

const Note = mongoose.model("Note", noteSchema)

export default Note
