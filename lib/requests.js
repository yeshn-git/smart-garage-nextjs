/* =========================================================================
   lib/requests.js - creates a service request in the cloud
   1. (optional) store the vehicle image  -> Firestore or Cloud Storage
   2. AI analysis via /api/analyze        -> Google Gemini
   3. save the request                     -> Cloud Firestore
   ========================================================================= */
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDb, getStorageClient, IMAGE_STORAGE_MODE } from "./firebase";
import { requestAIAnalysis } from "./ai-client";
import { compressImage } from "./utils";

export async function createServiceRequest({ user, profile, data, file, reuseAnalysis, onStep = () => {} }) {
  const db = getDb();
  const requestRef = doc(collection(db, "serviceRequests")); // pre-generate ID
  let imageMode = "none";
  let imageUrl = "";
  let imageForAI = null;

  // 1. Image -> cloud
  if (file) {
    const img = await compressImage(file, IMAGE_STORAGE_MODE === "firestore" ? 900 : 1024);
    imageForAI = { base64: img.base64, mimeType: img.mimeType };
    if (IMAGE_STORAGE_MODE === "storage") {
      onStep("1/3 Uploading vehicle image to Cloud Storage...");
      const storageRef = ref(getStorageClient(), `vehicle-images/${user.uid}/${requestRef.id}.jpg`);
      await uploadBytes(storageRef, img.blob, { contentType: "image/jpeg" });
      imageUrl = await getDownloadURL(storageRef);
      imageMode = "storage";
    } else {
      onStep("1/3 Saving vehicle image to Cloud Firestore...");
      await setDoc(doc(db, "requestImages", requestRef.id), {
        customerId: user.uid,
        dataUrl: img.dataUrl,
        createdAt: serverTimestamp()
      });
      imageMode = "firestore";
    }
  }

  // 2. AI analysis (reuse the one from the AI Assistant page if unchanged)
  let aiAnalysis = null;
  let aiStatus = "failed";
  let aiError = null;
  if (reuseAnalysis && !imageForAI) {
    aiAnalysis = reuseAnalysis;
    aiStatus = "completed";
  } else {
    onStep("2/3 Gemini AI is analysing the problem...");
    try {
      aiAnalysis = await requestAIAnalysis({
        brand: data.brand, model: data.model, year: data.year, fuelType: data.fuelType,
        mileage: data.mileage, problem: data.problem, ...(imageForAI ? { image: imageForAI } : {})
      });
      aiStatus = "completed";
    } catch (err) {
      console.error("AI analysis failed, saving request without it:", err);
      aiError = err;
    }
  }

  // 3. Save to Firestore
  onStep("3/3 Saving request to Cloud Firestore...");
  const record = {
    customerId: user.uid,
    customerName: profile?.name || user.displayName || "",
    customerEmail: user.email,
    customerPhone: profile?.phone || "",
    vehicle: {
      brand: data.brand, model: data.model, year: data.year,
      regNumber: data.regNumber, fuelType: data.fuelType, mileage: data.mileage
    },
    problem: data.problem,
    imageMode,
    imageUrl,
    aiAnalysis,
    aiStatus,
    status: "Pending",
    adminNotes: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(requestRef, record);
  return { id: requestRef.id, record: { ...record, createdAt: new Date(), updatedAt: new Date() }, aiError };
}
