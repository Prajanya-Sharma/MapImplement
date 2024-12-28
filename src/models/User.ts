import mongoose, { Schema, Document, Model } from "mongoose";
import { v4 as uuidv4 } from 'uuid'

export interface User extends Document {
    username: string;
    email: string;
    password: string;
    verifyCode: string;
    verifyCodeExpiry: Date;
    isVerified: boolean;
    isStudent:boolean
    isTeacher: boolean;
    isAdmin: boolean;
}

const UserSchema: Schema<User> = new Schema({
    username: {
        type: String,
        required: [true, 'username is required'],
        unique: true,
    },
    email: {
        type: String,
        required: [true, 'email is required'],
        unique: true,
        match: [/^[a-zA-Z0-9._%+-]+@pec\.edu\.in$/, 'please use college email id'],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    verifyCode: {
        type: String,
        required: [true, 'Verification Code is required'],
    },
    verifyCodeExpiry: {
        type: Date,
        required: [true, 'Expiry is required'],
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isStudent: {
        type: Boolean,
        default: false,
    },
    isTeacher: {
        type: Boolean,
        default: false, // Default to false, only true if admin updates the field
    },
    isAdmin: {
        type: Boolean,
        default: false,
    }
});

UserSchema.post("save", async function (this: User) {
    if (this.isStudent) {
        
        try {
            const existingStudent = await StudentModel.findOne({ user_id: this._id });
            if (existingStudent) {
                console.log(`Student with user_id ${this._id} already exists.`);
                return; 
            }
            const studentId = `S-${uuidv4()}`;
            const newStudent = new StudentModel({
                user_id: this._id,
                name: this.username,
                student_id: studentId,
                semester: 1,
                branch: "Unknown",
                sid_verification: false,
                enrolledSubjectId: [],
                teacherSubjectMap: {},
                attendanceSubjectMap: {},
                clubsPartOf: [],
                interestedEvents: [],
                clubsHeadOf: [],
                profile: "",
                friends: []
            });

            await newStudent.save();
        } catch (error) {
            console.error("Error creating student:", error);
        }
    }

    if (this.isTeacher) {
        try {
            const teacherId = `T-${uuidv4()}`;
            const newTeacher = new TeacherModel({
                user_id: this._id,
                teacher_id: teacherId,
                admin_verification: false,
                subjectTeaching: [],
                // StudentsMarksMap: {},
            });

            await newTeacher.save();
        } catch (error) {
            console.error("Error creating teacher:", error);
        }
    }
});


export interface Student extends Document {
    user_id: mongoose.Schema.Types.ObjectId;
    name: string;
    student_id?: string;
    semester: number;
    phoneNumber?: number;
    branch: string;
    sid_verification: boolean;
    enrolledSubjectId: string[];
    teacherSubjectMap: Record<string, mongoose.Schema.Types.ObjectId>;
    attendanceSubjectMap: Record<number, string>;
    clubsPartOf: mongoose.Schema.Types.ObjectId[];
    interestedEvents: mongoose.Schema.Types.ObjectId[];
    clubsHeadOf: mongoose.Schema.Types.ObjectId[];
    profile?: string;
    friends: mongoose.Schema.Types.ObjectId[];
}


const StudentSchema: Schema<Student> = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: { type: String, required: true },
    student_id: { type: String, unique: true },
    semester: { type: Number, required: true },
    phoneNumber: { type: Number },
    branch: { type: String, required: true },
    sid_verification: { type: Boolean, default: false },
    enrolledSubjectId: [{ type: String }],
    teacherSubjectMap: {
        type: Map,
        of: Schema.Types.ObjectId,
    },
    attendanceSubjectMap: {
        type: Map,
        of: String,
    },
    clubsPartOf: [{ type: Schema.Types.ObjectId, ref: "Club" }],
    interestedEvents: [{ type: Schema.Types.ObjectId, ref: "Event" }],
    clubsHeadOf: [{ type: Schema.Types.ObjectId, ref: "Club" }],
    profile: {
        type: String,
        required: false,
    },
    friends: [{ type: Schema.Types.ObjectId, ref: "Student" }],
});


export interface Teacher extends Document {
    user_id: mongoose.Schema.Types.ObjectId;
    teacher_id: string;
    admin_verification: boolean;
    subjectTeaching: string[];
}

const TeacherSchema: Schema<Teacher> = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    teacher_id: { type: String, required: true, unique: true },
    admin_verification: { type: Boolean, default: false },
    subjectTeaching: [{ type: String }],
    // StudentsMarksMap: {
    //     type: Map,
    //     of: {
    //         midsem: {
    //             type: Map,
    //             of: Number,
    //         },
    //         endsem: {
    //             type: Map,
    //             of: Number,
    //         },
    //     },
    //
    // },
});

export interface Club extends Document {
    clubName: string;
    clubLogo?: string;
    clubIdSecs: string[];
    clubMembers: string[];
    clubEvents: mongoose.Schema.Types.ObjectId[];
}

const ClubSchema: Schema<Club> = new Schema({
    clubName: { type: String, required: true, unique: true },
    clubLogo: { type: String },
    clubIdSecs: [{ type: String, ref: "Student" }],
    clubMembers: [{ type: String, ref: "Student" }],
    clubEvents: [{ type: Schema.Types.ObjectId, ref: "Event" }],
});
export interface Event extends Document {
    eventHostedBy: mongoose.Schema.Types.ObjectId;
    eventVenue: string;
    eventTime: Date;
    interestedMembersArr: mongoose.Schema.Types.ObjectId[];
    eventAttachments?: string[];
    poster: string;
    heading: string;
    description: string;
    tags: string[];
}

const EventSchema: Schema<Event> = new Schema({
    eventHostedBy: {
        type: Schema.Types.ObjectId,
        ref:"Club"
    },
    eventVenue: { type: String, required: true },
    eventTime: { type: Date, required: true },
    interestedMembersArr: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    eventAttachments: [{ type: String }],
    poster: { type: String, required: true },
    heading: { type: String, required: true },
    description: { type: String, required: true },
    tags: [{ type: String }],
});



export interface Subject extends Document {
  subjectId: string;
  allMarks: {
    examType: string;
    studentMarks: {
      student_id: string;
      marks: number;
    }[];
  }[];
}

const SubjectSchema: Schema<Subject> = new Schema({
    subjectId: { type: String, required: true },
    allMarks: {
      type: [
        {
          examType: { type: String, required: true },
          studentMarks: [
            {
              student_id: { type: String, required: true },
              marks: { type: Number, required: true },
            },
          ],
        },
      ],
      default: [],
    },
  });



export interface Attendance extends Document {
    subjectId: string;
    totalClasses: number;
    dateStudentMap: {
        date: Date;
        studentPresent: mongoose.Schema.Types.ObjectId[];
    }[];
    code: number;
}

const AttendanceSchema: Schema<Attendance> = new Schema({
    subjectId: { type: String, required: true },
    totalClasses: { type: Number, required: true },
    dateStudentMap: [{
        date: { type: Date, required: true },
        studentPresent: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    }],
    code: { type: Number},
})



export interface Request extends Document {
    user_id: mongoose.Schema.Types.ObjectId;
    for_teacher: boolean;
    for_admin: boolean;
}

const RequestSchema: Schema<Request> = new Schema({
    user_id: {type: Schema.Types.ObjectId, ref: "User" },
    for_teacher: {type: "boolean", default: false},
    for_admin: {type: "boolean", default: false},
})



export interface FriendRequest extends Document {
    from: mongoose.Schema.Types.ObjectId;
    to: mongoose.Schema.Types.ObjectId;
}

const FriendRequestSchema: Schema<FriendRequest> = new Schema({
    from: {type: Schema.Types.ObjectId, ref: "Student" },
    to: {type: Schema.Types.ObjectId, ref: "Student" },
})

interface Eventai {
title: string;
description: string;
}

interface Markai {
subject: string;
marks: string;
}

interface Generalai {
title: string;
description: string;
}

interface Info {
events?: Eventai[];
marks?: Markai[];
general?: Generalai[];
}

export interface AiChatBot extends Document {
Info: Info;
}

const EventSchemaAI = new Schema<Eventai>({
title: { type: String, required: true },
description: { type: String, required: true },
});

const MarkSchemaAI = new Schema<Markai>({
subject: { type: String, required: true },
marks: { type: String, required: true },
});

const GeneralSchemaAI = new Schema<Generalai>({
title: { type: String, required: true },
description: { type: String, required: true },
});

const AiChatBotSchema: Schema<AiChatBot> = new Schema({
Info: {
    events: [EventSchemaAI],
    marks: [MarkSchemaAI],  
    general: [GeneralSchemaAI], 
}},
{ collection: 'aiChatBot' }
);

const aiChatBotModel: Model<AiChatBot> =
    mongoose.models.aiChatBot || mongoose.model<AiChatBot>("aiChatBot", AiChatBotSchema);

const UserModel: Model<User> =
    mongoose.models.User || mongoose.model<User>("User", UserSchema);

const StudentModel: Model<Student> =
    mongoose.models.Student || mongoose.model<Student>("Student", StudentSchema);

const TeacherModel: Model<Teacher> =
    mongoose.models.Teacher || mongoose.model<Teacher>("Teacher", TeacherSchema);

const ClubModel: Model<Club> =
    mongoose.models.Club|| mongoose.model<Club>("Club", ClubSchema);

const EventModel: Model<Event> =
    mongoose.models.Event || mongoose.model<Event>("Event", EventSchema);

const SubjectModel : Model<Subject>=
    mongoose.models.Subject || mongoose.model<Subject>("Subject",SubjectSchema);

const AttendanceModel: Model<Attendance> =
    mongoose.models.Attendance || mongoose.model<Attendance>("Attendance", AttendanceSchema);

const RequestModel: Model<Request> =
    mongoose.models.Request || mongoose.model<Request>("Request", RequestSchema);

const FriendRequestModel: Model<FriendRequest> =
    mongoose.models.FriendRequest || mongoose.model<FriendRequest>("FriendRequest", FriendRequestSchema);

export {
    UserModel,
    StudentModel,
    TeacherModel,
    ClubModel,
    EventModel,
    SubjectModel,
    AttendanceModel,
    RequestModel,
    FriendRequestModel,
    aiChatBotModel
};
