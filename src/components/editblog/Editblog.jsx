import React, { useState, useContext, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { BsFillArrowLeftCircleFill } from "react-icons/bs";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button, Typography } from "@material-tailwind/react";
import { Timestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { fireDb, storage } from "../../../firebase/FirebaseConfig";
import myContext from "../../../context/data/myContext";

const EditBlog = () => {
  const { id } = useParams();
  const context = useContext(myContext);
  const { mode } = context;
  const navigate = useNavigate();

  const [blog, setBlog] = useState({
    title: "",
    category: "",
    content: "",
    thumbnail: "",
  });
  const [newThumbnail, setNewThumbnail] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const docRef = doc(fireDb, "blogPost", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBlog(docSnap.data());
        } else {
          toast.error("Blog not found");
          navigate("/");
        }
      } catch (error) {
        toast.error("Error fetching blog");
        navigate("/");
      }
    };

    fetchBlog();
  }, [id, navigate]);

  const handleUpdate = async () => {
    if (!blog.title || !blog.category || !blog.content) {
      toast.error("All fields are required");
      return;
    }

    try {
      let thumbnailUrl = blog.thumbnail;
      if (newThumbnail) {
        thumbnailUrl = await uploadThumbnail(newThumbnail);
      }

      await updateDoc(doc(fireDb, "blogPost", id), {
        ...blog,
        thumbnail: thumbnailUrl,
        time: Timestamp.now(),
        date: new Date().toLocaleDateString("en-US"),
      });

      toast.success("Post Updated Successfully");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Error updating post");
    }
  };

  const uploadThumbnail = async (file) => {
    const fileRef = ref(storage, `blogImages/${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    return getDownloadURL(snapshot.ref);
  };

  return (
    <div className={`container mx-auto max-w-5xl py-6 ${mode === "dark" ? "bg-gray-800 text-white" : "bg-gray-100 text-black"}`}>
      <div className="p-5">
        <div className="mb-2 flex justify-between items-center">
          <Link to="/dashboard">
            <BsFillArrowLeftCircleFill size={25} />
          </Link>
          <Typography variant="h4">Edit Blog</Typography>
        </div>

        {blog.thumbnail && !newThumbnail && (
          <img
            className="w-full rounded-md mb-3"
            src={blog.thumbnail}
            alt="Blog Thumbnail"
          />
        )}

        <Typography variant="small" color="blue-gray" className="mb-2">
          {newThumbnail ? "Upload New Thumbnail" : "Current Thumbnail"}
        </Typography>
        <input
          type="file"
          className={`shadow-inner rounded-md p-2 ${mode === "dark" ? "bg-gray-700" : "bg-gray-200"}`}
          onChange={(e) => setNewThumbnail(e.target.files[0])}
        />

        <div className="mb-3">
          <input
            type="text"
            className={`shadow-inner rounded-md p-2 ${mode === "dark" ? "bg-gray-700 text-white" : "bg-gray-200"}`}
            placeholder="Enter Your Title"
            value={blog.title}
            onChange={(e) => setBlog({ ...blog, title: e.target.value })}
          />
        </div>

        <div className="mb-3">
          <input
            type="text"
            className={`shadow-inner rounded-md p-2 ${mode === "dark" ? "bg-gray-700 text-white" : "bg-gray-200"}`}
            placeholder="Enter Your Category"
            value={blog.category}
            onChange={(e) => setBlog({ ...blog, category: e.target.value })}
          />
        </div>

        <Editor
          apiKey="YOUR_TINYMCE_API_KEY"
          initialValue={blog.content}
          value={blog.content}
          onEditorChange={(content) => setBlog({ ...blog, content })}
          init={{
            plugins: "advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table paste code help wordcount",
            toolbar: "undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
            height: 400,
            menubar: false,
          }}
        />

        <Button className="w-full mt-5" onClick={handleUpdate}>
          Update Post
        </Button>
      </div>
    </div>
  );
};

export default EditBlog;
