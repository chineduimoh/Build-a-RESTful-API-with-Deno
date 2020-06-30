import { HandlerFunc, Context } from "https://deno.land/x/abc@v1.0.0-rc2/mod.ts";
import db from '../models/db.ts';
import { ErrorHandler } from "../utils/middlewares.ts"

const database = db.getDatabase;
const contacts = database.collection('contacts');

interface Contact {
  _id: {
    $oid: string;
  };
  name: string;
  age: number;
  email: string;
  address: string;
}

export const createContact: HandlerFunc = async (c: Context) => {
  try {
    if (c.request.headers.get("content-type") !== "application/json") {
      throw new ErrorHandler("Invalid body", 422);
    }
    const body = await (c.body());
    if (!Object.keys(body).length) {
      throw new ErrorHandler("Request body can not be empty!", 400);
    }
    const { name, age, email, address } = body;

    const insertedContact = await contacts.insertOne({
      name,
      age,
      email,
      address
    });

    return c.json(insertedContact, 201);
  } catch (error) {
    throw new ErrorHandler(error.message, error.status || 500);
  }
};

export const getAllContact: HandlerFunc = async (c: Context) => {
  try {
    const getContacts: Contact[] = await contacts.find();
    if (getContacts) {
      const list = getContacts.length
        ? getContacts.map((contact) => {
          const { _id: { $oid }, name, age, email, address } = contact;
          return { id: $oid, name, age, email, address };
        })
        
        : [];
      return c.json(list, 200);
    }
  } catch (error) {
    throw new ErrorHandler(error.message, error.status || 500);
  }
};

export const getOneContact: HandlerFunc = async (c: Context) => {
  try {
    const { id } = c.params as { id: string };

    const getContact = await contacts.findOne({ _id: { "$oid": id } });

    if (getContact) {
      const { _id: { $oid }, name, age, email, address } = getContact;

      return c.json({ id: $oid, name, age, email, address }, 200);
    }
    throw new ErrorHandler("Contact not found", 404);
  } catch (error) {
    throw new ErrorHandler(error.message, error.status || 500);
  }
};

export const updateContact: HandlerFunc = async (c: Context) => {
  try {
    const { id } = c.params as { id: string };
    if (c.request.headers.get("content-type") !== "application/json") {
      throw new ErrorHandler("Invalid body", 422);
    }

    const body = await (c.body()) as {
      name?: string;
      age?: number;
      email?: string;
      address?: string;
    };

    if (!Object.keys(body).length) {
      throw new ErrorHandler("Request body can not be empty!", 400);
    }

    const getContact = await contacts.findOne({ _id: { "$oid": id } });

    if (getContact) {
      const { matchedCount } = await contacts.updateOne(
        { _id: { "$oid": id } },
        { $set: body },
      );
      if (matchedCount) {
        return c.string("Contact updated successfully!", 204);
      }
      return c.string("Unable to update contact");
    }
    throw new ErrorHandler("Contact not found", 404);
  } catch (error) {
    throw new ErrorHandler(error.message, error.status || 500);
  }
};


export const deleteContact: HandlerFunc = async (c: Context) => {
  try {
    const { id } = c.params as { id: string };

    const getContact = await contacts.findOne({ _id: { "$oid": id } });

    if (getContact) {
      const deleteCount = await contacts.deleteOne({ _id: { "$oid": id } });
      if (deleteCount) {
        return c.string("Contact deleted successfully!", 204);
      }
      throw new ErrorHandler("Unable to delete employee", 400);
    }

    throw new ErrorHandler("Contact not found", 404);
  } catch (error) {
    throw new ErrorHandler(error.message, error.status || 500);
  }
};