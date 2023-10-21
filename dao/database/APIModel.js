import mongoose, { Schema } from 'mongoose';

/**
 * API表
 */
const info = {
    model: "API",
    table: "s_api",
    property: {
        module: {
            type: String,
            required: true,
            trim: true
        },
        model: {
            type: String,
            required: true,
            trim: true
        },
        path: {
            type: String,
            required: true,
            trim: true
        },
        method: {
            type: String,
            default: "GET",
            trim: true
        },
        authorized: {
            type: Boolean,
            default: false
        },
        customize: {
            type: Boolean,
            default: false
        },
        type: {
            type: String,
            default: "SELECT"
        },
        input_fields: String,
        output_fields: String,
        where: String,
        success_message: {
            type: String,
            default: "成功!"
        },
        error_message: {
            type: String,
            default: "失败!"
        },
        handler: {
            type: String,
            required: true
        },
        status: {
            type: Boolean,
            default: true
        },
        create_time: {
            type: Date,
            default: Date.now
        },
        update_time: {
            type: Date,
            default: Date.now
        }
    }
};

export const Model = mongoose.model(info.model, new Schema(info.property), info.table);

/**
 * @typedef {import('#dao/BaseDAO').RawDocType<typeof Model>} API
 */
