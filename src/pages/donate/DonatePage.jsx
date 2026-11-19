import { useState, useEffect } from "react";
import {
  Copy, Check, Building2, QrCode, ShieldCheck,
  FileText, Maximize2, X, HeartHandshake, CheckCircle2
} from "lucide-react";
import { PageHeader } from "../../components/common";

const UPI_ID = "bwfoundation26@hdfcbank";

const BANK_DETAILS = {
  accountName: "Beacon Wings Foundation",
  bankName: "HDFC Bank",
  accountNumber: "50200124792425",
  ifscCode: "HDFC0004736",
  accountType: "Current Account (CA-INSTITUTION)",
  branch: "Okhla Industrial Area Phase II, New Delhi - 110020",
};

function DonatePage() {
  const [copiedKey, setCopiedKey] = useState("");
  const [showChequeModal, setShowChequeModal] = useState(false);

      // Modal ESC & Scroll Lock
      useEffect(() => {
        if (!showChequeModal) return;
        const handleKeyDown = (e) => {
          if (e.key === "Escape") setShowChequeModal(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
          window.removeEventListener("keydown", handleKeyDown);
          document.body.style.overflow = originalOverflow;
        };
      }, [showChequeModal]);

      const copyToClipboard = (text, key) => {
        navigator.clipboard.writeText(text).then(() => {
          setCopiedKey(key);
          setTimeout(() => setCopiedKey(""), 2200);
        });
      };

      return (
    <>
          <PageHeader
            eyebrow="Make a Difference"
            title="Support Our Mission"
            description="Every rupee directly funds child education, healthcare drives, elder care, and grassroots community empowerment across India."
          />

                  <section className="py-14 bg-slate-50/60 dark:bg-slate-950">
                    <div className="container-max">
                      {/* Top Trust Banner */}
                      <div className="mb-10 mx-auto max-w-3xl text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                          <ShieldCheck size={14} /> Official Verified NGO Account
                        </span>
                        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                          Choose Your Preferred Payment Method
                        </h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          You can make a quick UPI payment or transfer directly into our official HDFC Bank account via NEFT, IMPS, or RTGS.
                        </p>
                      </div>

                        {/* Two-Column Grid: UPI QR Code vs Direct Bank Transfer */}
                        <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto items-start">
                          {/* ── CARD 1: UPI & QR CODE PAYMENT ───────────────────── */}
                          <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
                              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                                <QrCode size={26} />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                  Scan &amp; Pay via UPI
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Instant zero-fee transfer with any UPI app
                                </p>
                              </div>
                            </div>

                            {/* QR Code Poster Image */}
                            <div className="mt-6 flex flex-col items-center">
                              <div className="relative group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white p-2 shadow-inner">
                                <img
                                  src="/images/beacon-wings-upi-qr.jpeg"
                                  alt="HDFC Bank UPI QR Code — Beacon Wings Foundation"
                                  className="w-72 max-w-full rounded-xl object-contain transition duration-300 group-hover:scale-[1.02]"
                                />
                              </div>

                              <p className="mt-4 text-base font-extrabold text-slate-900 dark:text-white">
                                Beacon Wings Foundation
                              </p>
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                HDFC Bank Collect Now • Powered by Razorpay
                              </span>

                              {/* Copyable UPI ID Box */}
                              <div className="mt-5 w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3">
                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                                  <span>UPI ID</span>
                                  {copiedKey === "upi" && (
                                    <span className="font-semibold text-green-600 dark:text-green-400">
                                      Copied to clipboard!
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 break-all select-all">
                                    {UPI_ID}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(UPI_ID, "upi")}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-95 flex-shrink-0"
                                    title="Copy UPI ID"
                                  >
                                    {copiedKey === "upi" ? (
                                      <>
                                        <Check size={14} className="text-white" /> Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={14} /> Copy
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Supported Apps Badges */}
                              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1">GPay</span>
                                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1">PhonePe</span>
                                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1">Paytm</span>
                                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1">PayZapp</span>
                                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1">BHIM</span>
                              </div>
                            </div>
                          </div>

                          {/* ── CARD 2: DIRECT BANK TRANSFER (NEFT / IMPS / RTGS) ── */}
                          <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
                              <div className="rounded-2xl bg-teal-500/10 p-3 text-teal-600 dark:text-teal-400">
                                <Building2 size={26} />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                  Direct Bank Transfer
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  NEFT / IMPS / RTGS &amp; NetBanking transfers
                                </p>
                              </div>
                            </div>

                              {/* Bank Details List */}
                              <div className="mt-6 space-y-3.5 flex-1">
                                {/* Beneficiary Name */}
                                <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 p-3.5">
                                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                                    <span>Beneficiary / Account Name</span>
                                    {copiedKey === "name" && (
                                      <span className="text-[11px] font-semibold text-green-600">Copied!</span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                      {BANK_DETAILS.accountName}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(BANK_DETAILS.accountName, "name")}
                                      className="p-1.5 text-slate-400 hover:text-primary transition rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700"
                                      title="Copy Beneficiary Name"
                                    >
                                      {copiedKey === "name" ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                    </button>
                                  </div>
                                </div>

                                {/* Account Number */}
                                <div className="rounded-xl border-2 border-primary/20 dark:border-primary/40 bg-primary/5 dark:bg-primary/10 p-3.5">
                                  <div className="flex items-center justify-between text-xs text-primary font-semibold mb-0.5">
                                    <span>Account Number</span>
                                    {copiedKey === "acc" && (
                                      <span className="text-[11px] font-bold text-green-600">Copied!</span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-wider select-all">
                                      {BANK_DETAILS.accountNumber}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(BANK_DETAILS.accountNumber, "acc")}
                                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90 active:scale-95"
                                      title="Copy Account Number"
                                    >
                                      {copiedKey === "acc" ? (
                                        <>
                                          <Check size={14} /> Copied
                                        </>
                                      ) : (
                                        <>
                                          <Copy size={14} /> Copy
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* IFSC Code */}
                                <div className="rounded-xl border-2 border-teal-500/20 dark:border-teal-500/40 bg-teal-50/40 dark:bg-teal-950/20 p-3.5">
                                  <div className="flex items-center justify-between text-xs text-teal-700 dark:text-teal-400 font-semibold mb-0.5">
                                    <span>IFSC Code (RTGS / NEFT / IMPS)</span>
                                    {copiedKey === "ifsc" && (
                                      <span className="text-[11px] font-bold text-green-600">Copied!</span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-wider select-all">
                                      {BANK_DETAILS.ifscCode}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(BANK_DETAILS.ifscCode, "ifsc")}
                                      className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700 active:scale-95"
                                      title="Copy IFSC Code"
                                    >
                                      {copiedKey === "ifsc" ? (
                                        <>
                                          <Check size={14} /> Copied
                                        </>
                                      ) : (
                                        <>
                                          <Copy size={14} /> Copy
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Bank Name & Account Type */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 p-3">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Bank Name</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5">
                                      {BANK_DETAILS.bankName}
                                    </span>
                                  </div>
                                  <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 p-3">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Account Type</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5">
                                      Current Account
                                    </span>
                                  </div>
                                </div>

                                {/* Branch */}
                                <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 p-3">
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Branch</span>
                                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block mt-0.5 leading-relaxed">
                                    {BANK_DETAILS.branch}
                                  </span>
                                </div>
                              </div>

                              {/* View Bank Cheque Verification Button */}
                              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => setShowChequeModal(true)}
                                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-700/80 active:scale-98"
                                >
                                  <FileText size={16} className="text-primary" />
                                  View Official Bank Cheque / Verification Document
                                  <Maximize2 size={13} className="text-slate-400 ml-1" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Confirmation & Receipt Instructions */}
                          <div className="mt-12 max-w-3xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                              <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400 flex-shrink-0">
                                <HeartHandshake size={28} />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                  Need a Donation Receipt or 80G Acknowledgement?
                                </h4>
                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                  After completing your transfer via UPI or NetBanking, please share your transaction reference ID, full name, and PAN card copy on WhatsApp at{" "}
                                  <strong className="text-slate-900 dark:text-slate-200">+91 7275982849</strong> or email us at{" "}
                                  <strong className="text-slate-900 dark:text-slate-200">director@beaconwingsfoundation.org</strong>.
                                  Our team will issue an official receipt within 24 hours.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* ── OFFICIAL BANK CHEQUE MODAL ─────────────────────────────── */}
                      {showChequeModal && (
                        <div
                          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200"
                          onClick={() => setShowChequeModal(false)}
                        >
                          <div
                            className="relative flex max-h-[92vh] max-w-4xl w-full flex-col items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setShowChequeModal(false)}
                              className="absolute -right-2 -top-2 sm:-right-4 sm:-top-4 z-20 rounded-full bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white shadow-2xl transition hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105"
                              aria-label="Close cheque modal"
                            >
                              <X size={20} />
                            </button>

                            <div className="relative overflow-hidden rounded-2xl bg-black/40 shadow-2xl max-w-full flex items-center justify-center p-2">
                              <img
                                src="/images/bank-cheque-horizontal.jpg"
                                alt="Official HDFC Bank Cheque — Beacon Wings Foundation"
                                className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                              />
                            </div>

                            <div className="mt-3 text-center text-white">
                              <p className="text-sm font-bold">HDFC Bank Official Cheque Verification</p>
                              <p className="text-xs text-slate-300">Beacon Wings Foundation • A/C No: 50200124792425 • IFSC: HDFC0004736</p>
                            </div>
                          </div>
                        </div>
      )}
                </>
                );
}

                export default DonatePage;
