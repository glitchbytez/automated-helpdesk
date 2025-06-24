import mongoose from "mongoose"

const feedbackSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: [true, "Session ID is required"],
            trim: true,
        },
        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            trim: true,
        },
        satisfied: {
            type: Boolean,
            required: [true, "Satisfaction status is required"],
        },
        // Reference to the ChatSession if available
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ChatSession",
        }
    },
    {
        timestamps: true,
    }
)

const Feedback = mongoose.model("Feedback", feedbackSchema)

export default Feedback
