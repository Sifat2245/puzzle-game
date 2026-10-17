import React from 'react';
import { X } from 'lucide-react';
import { useGame } from '../context/GameContext.jsx';
import Modal from './Modal.jsx';

export default function HelpModal() {
  const { showHelpModal, setShowHelpModal } = useGame();
  return (
    showHelpModal && (
      <Modal
        titleId="help-title"
        onClose={() => setShowHelpModal(false)}
        className="max-w-md p-5 space-y-3 text-xs"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <h3 id="help-title" className="text-base font-bold">
            বন্ধুদের সঙ্গে যেভাবে খেলবেন
          </h3>
          <button
            aria-label="সহায়তা বন্ধ করুন"
            onClick={() => setShowHelpModal(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <ul className="space-y-2 text-gray-300 leading-relaxed">
          <li>
            <strong className="text-white">টানুন আর মেলান:</strong> একটি টুকরো টেনে তার মিল থাকা
            টুকরোর পাশে, অথবা ফ্রেমের ঠিক জায়গায় রাখুন। জোড়া লাগা টুকরোগুলো একসঙ্গে সরবে। ফাঁকা
            জায়গা টেনে টেবিল সরান। মোবাইলে দুই আঙুল দিয়ে, কম্পিউটারে মাউসের চাকা ঘুরিয়ে ছোট-বড় করুন।
            জুমের সংখ্যায় চাপলে সব টুকরো একসঙ্গে দেখা যাবে।
          </li>
          <li>
            <strong className="text-white">১. বন্ধুকে ডাকুন:</strong> উপরের{' '}
            <strong>বন্ধুকে ডাকুন</strong> বোতাম চেপে রুমের লিংক কপি করুন, তারপর বন্ধুদের পাঠিয়ে
            দিন।
          </li>
          <li>
            <strong className="text-white">২. নিজের ছবির পাজল:</strong> রুমের মালিক শুরুর পাতা বা
            নিচের বার থেকে নিজের ছবি দিতে পারেন। সেই ছবিই সবার পাজল হয়ে যাবে।
          </li>
          <li>
            <strong className="text-white">৩. বন্ধুকে জায়গা দেখান:</strong> টেবিলের কোথাও দুবার
            চাপুন, অথবা <strong>দেখান</strong> বোতাম চাপুন। গোল চিহ্ন দিয়ে বন্ধুদের সঠিক জায়গা
            দেখাতে পারবেন।
          </li>
        </ul>
        <div className="flex justify-end pt-2">
          <button
            onClick={() => setShowHelpModal(false)}
            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer"
          >
            বুঝেছি, খেলতে যাই!
          </button>
        </div>
      </Modal>
    )
  );
}
