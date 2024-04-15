const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const CommentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

CommentSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("Comment", CommentSchema);
