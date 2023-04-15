import { config, list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";
import { text } from "@keystone-6/core/fields";
import { relationship, password, image, file ,checkbox } from "@keystone-6/core/fields";
import { document } from '@keystone-6/fields-document';
import dotenv from "dotenv";
import { statelessSessions } from '@keystone-6/core/session';
import { createAuth } from '@keystone-6/auth';
import Jimp from "jimp";
import path from "path";
import { type } from "os";

// import kk from './images/demo.png'

dotenv.config();

const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  secretField: 'password',
  sessionData: 'isAdmin',
});

const session = statelessSessions({
  secret: '-- EXAMPLE COOKIE SECRET; CHANGE ME --',
});

// const Session = {
//   data: {
//     id: string,
//     isAdmin: boolean
//   }
// }


type Session = {
  data: {
    id: string;
    isAdmin: boolean;
  }
}

const isAdmin = ({ session }: { session: Session }) => session?.data.isAdmin;

const filterPosts = ({ session }: { session: Session }) => {
  // if the user is an Admin, they can access all the records

    console.log('mob',session)
  
  if (session?.data.isAdmin) return true;
  // otherwise, filter for published posts
  return { valid: { equals: false } };
}

 const lists = {
  User: list({
    access: allowAll,
    fields: {
      name: text({ validation: { isRequired: true } }),
      email: text({ validation: { isRequired: true }, isIndexed: "unique" }),
      posts: relationship({ ref: "Post.author", many: true }),
      password: password({ validation: { isRequired: true } }),
      isAdmin: checkbox(),
    },
  }),
  Category: list({
    access: {
      operation: {
        create: isAdmin,
        update: isAdmin,
        delete: isAdmin,
      },
       filter: {
      query: filterPosts,
    }
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      valid: checkbox(),
      // email: text({ validation: { isRequired: true }, isIndexed: "unique" }),
      // posts: rel ationship({ ref: "Post.author", many: true }),
      // password: password({ validation: { isRequired: true } }),
    },
  }),
  Product: list({
    access: allowAll, 
    fields: {
      name: text({ validation: { isRequired: true } }),
      price: text({ validation: { isRequired: true } }),
      category: relationship({ ref: "Category", many: true }),
      // email: text({ validation: { isRequired: true }, isIndexed: "unique" }),
      // posts: relationship({ ref: "Post.author", many: true }),
      // password: password({ validation: { isRequired: true } }),
    },
  }),
  Order: list({
    access: allowAll,
    fields: {
      user: relationship({ ref: "User", many: false }),
      product: relationship({ ref: "Product", many: false }),
      // price: relationship({ ref: "Product.price", many: false }),
      // email: text({ validation: { isRequired: true }, isIndexed: "unique" }),
      // posts: relationship({ ref: "Post.author", many: true }),
      // password: password({ validation: { isRequired: true } }),
    },
  }),

  Post: list({
    access: allowAll,
    fields: {
      content: document({
        relationships: {
          mention: {
            listKey: 'User',
            label: 'Mention',
            selection: 'id name',
          },
        },
        formatting: true,
        dividers: true,
        links: true,
        layouts: [
          [1, 1],
          [1, 1, 1],
        ],
      }),
      title: text(),
      author: relationship({ ref: "User.posts" ,many :false }),
      isComplete:checkbox(),
      avatar: image({ storage: "my_local_images" }),
    },

    hooks: {
      afterOperation: ({ operation, item }) => {
        console.log("item", item);
        if (operation === "create" || operation ===  "update" ) {
          console.log("item", item.avatar_id);

          // Jimp.read(
          //   `./public/images/${item.avatar_id}.${item.avatar_extension}`
          // )
          //   .then((lenna) => {
          //     return lenna
          //       .resize(360, 640) // resize
          //       .quality(60) // set JPEG quality
          //       .greyscale() // set greyscale
          //       .write(
          //         `./public/images/${new Date().getTime()}mobile.${
          //           item.avatar_extension
          //         }`
          //       ); // save
          //   })
          //   .catch((err) => {
          //     console.error("error", err);
          //   });

          // Jimp.read(
          //   `./public/images/${item.avatar_id}.${item.avatar_extension}`
          // )
          //   .then((lenna) => {
          //     return lenna
          //       .resize(768, 1024) // resize
          //       .quality(60) // set JPEG quality
          //       .greyscale() // set greyscale
          //       .write(
          //         `./public/images/${new Date().getTime()}tablet.${
          //           item.avatar_extension
          //         }`
          //       ); // save
          //   })
          //   .catch((err) => {
          //     console.error("error", err);
          //   });

          // Jimp.read(
          //   `./public/images/${item.avatar_id}.${item.avatar_extension}`
          // )
          //   .then((lenna) => {
          //     return lenna
          //       .resize(1920, 1080) // resize
          //       .quality(60) // set JPEG quality
          //       .greyscale() // set greyscale
          //       .write(
          //         `./public/images/${new Date().getTime()}desktop.${
          //           item.avatar_extension
          //         }`
          //       ); // save
          //   })
          //   .catch((err) => {
          //     console.error("error", err);
          //   });
        }
      },
      resolveInput: ({ resolvedData }) => {
        console.log("ll");
        const { title, avatar } = resolvedData;

        return resolvedData;
      },
    },
  }),
}

const {
  S3_BUCKET_NAME: bucketName = "keystone-test",
  S3_REGION: region = "ap-southeast-2",
  S3_ACCESS_KEY_ID: accessKeyId = "keystone",
  S3_SECRET_ACCESS_KEY: secretAccessKey = "keystone",
  ASSET_BASE_URL: baseUrl = "http://localhost:3000",
} = process.env;

export default  withAuth(
  config({
    db: {
      provider: "postgresql",
      url: "postgres://postgres:welcome@localhost:5432/postgres",
    },
    lists,
    session,
    storage: {
      // The key here will be what is referenced in the image field
      my_local_images: {
        // Images that use this store will be stored on the local machine
        kind: "local",
        // This store is used for the image field type
        type: "image",
        // The URL that is returned in the Keystone GraphQL API
        generateUrl: (path) => `${baseUrl}/images${path}`,
        // The route that will be created in Keystone's backend to serve the images
        serverRoute: {
          path: "/images",
        },
        storagePath: "public/images",
      },
    },
  })

);
