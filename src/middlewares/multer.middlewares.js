import multer from "multer";

//cb = call back
//file is not configure in json so we used multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname) // not good practice we have to store file in unique way but for now it's alright
      //const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        //cb(null, file.fieldname + '-' + uniqueSuffix)
        //you can use comment program for good practice as this code will save unique name for every file uploaded
    }
  })
  
export const upload = multer({ storage,})
//or you can use this export const upload = multer({ storage:storage})