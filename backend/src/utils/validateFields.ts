// The goal is to accept the validation function factory safe parse the fields and throw error if validation failed.
// two parameters, {validationFactory,fields}

import { ZodObject } from "zod";
import { InvalidDataError } from "./AppError";

export function validateFields(zodObject:ZodObject, fields: unknown) {

    const validationResult = zodObject.safeParse(fields);
    if(!validationResult.success){
        const validationMessage = validationResult.error.issues.map(({path,message})=>{
            const issuePath = path.length > 0 ? path.join(".") : "input";
            return `${issuePath}: ${message}`;
        }).join(", ");

        throw new InvalidDataError(validationMessage);
    }

    return validationResult;
}