/**
 * SCORM 2004 4th Edition API Wrapper for Unity WebGL.
 * Locates the LMS API_1484_11 across the window hierarchy, initializes,
 * and sets cmi.score, cmi.completion_status, cmi.success_status, etc.
 */
(function (global) {
  "use strict";

  var apiInstance = null;
  var isInitialized = false;
  var isTerminated = false;

  function findAPI(win) {
    var findAttempts = 0;
    var maxAttempts = 10;
    while (win && findAttempts < maxAttempts) {
      try {
        if (win.API_1484_11) {
          return win.API_1484_11;
        }
      } catch (err) {
        // Cross-origin security boundary reached
        break;
      }
      try {
        if (win.parent && win.parent !== win) {
          win = win.parent;
        } else {
          break;
        }
      } catch (err) {
        break;
      }
      findAttempts++;
    }
    return null;
  }

  function getAPI() {
    if (apiInstance) return apiInstance;
    apiInstance = findAPI(global);
    if (!apiInstance && global.opener) {
      try {
        apiInstance = findAPI(global.opener);
      } catch (e) {}
    }
    return apiInstance;
  }

  var scorm2004 = {
    isAvailable: function () {
      return getAPI() !== null;
    },

    init: function () {
      if (isInitialized) return true;
      var api = getAPI();
      if (!api) {
        console.log("[SCORM 2004] No API_1484_11 found. Running in standalone mode.");
        return false;
      }
      try {
        var res = api.Initialize("");
        if (res === "true" || res === true) {
          isInitialized = true;
          isTerminated = false;
          console.log("[SCORM 2004] Successfully initialized session.");

          // Set initial incomplete status as standard SCORM practice
          api.SetValue("cmi.completion_status", "incomplete");
          api.SetValue("cmi.exit", "suspend");
          api.Commit("");
          return true;
        } else {
          console.warn("[SCORM 2004] Initialize failed: error " + api.GetLastError() + " (" + api.GetErrorString(api.GetLastError()) + ")");
          return false;
        }
      } catch (e) {
        console.error("[SCORM 2004] Exception during Initialize:", e);
        return false;
      }
    },

    setScore: function (scaled, raw, min, max) {
      var api = getAPI();
      if (!api || !isInitialized || isTerminated) return;
      try {
        api.SetValue("cmi.score.scaled", String(Math.max(-1, Math.min(1, scaled))));
        api.SetValue("cmi.score.raw", String(raw));
        api.SetValue("cmi.score.min", String(min));
        api.SetValue("cmi.score.max", String(max));
        console.log("[SCORM 2004] Score set: scaled=" + scaled + ", raw=" + raw);
      } catch (e) {
        console.error("[SCORM 2004] Error setting score:", e);
      }
    },

    setCompletion: function (status) {
      var api = getAPI();
      if (!api || !isInitialized || isTerminated) return;
      try {
        api.SetValue("cmi.completion_status", String(status));
        console.log("[SCORM 2004] Completion status set to: " + status);
      } catch (e) {
        console.error("[SCORM 2004] Error setting completion_status:", e);
      }
    },

    setSuccess: function (status) {
      var api = getAPI();
      if (!api || !isInitialized || isTerminated) return;
      try {
        api.SetValue("cmi.success_status", String(status));
        console.log("[SCORM 2004] Success status set to: " + status);
      } catch (e) {
        console.error("[SCORM 2004] Error setting success_status:", e);
      }
    },

    setSessionTime: function (isoDuration) {
      var api = getAPI();
      if (!api || !isInitialized || isTerminated) return;
      try {
        api.SetValue("cmi.session_time", String(isoDuration));
        console.log("[SCORM 2004] Session time set: " + isoDuration);
      } catch (e) {
        console.error("[SCORM 2004] Error setting session_time:", e);
      }
    },

    setSuspendData: function (dataStr) {
      var api = getAPI();
      if (!api || !isInitialized || isTerminated) return;
      try {
        api.SetValue("cmi.suspend_data", String(dataStr));
        console.log("[SCORM 2004] Suspend data stored.");
      } catch (e) {
        console.error("[SCORM 2004] Error setting suspend_data:", e);
      }
    },

    commit: function () {
      var api = getAPI();
      if (!api || !isInitialized || isTerminated) return false;
      try {
        var res = api.Commit("");
        return res === "true" || res === true;
      } catch (e) {
        console.error("[SCORM 2004] Error during Commit:", e);
        return false;
      }
    },

    terminate: function () {
      if (!isInitialized || isTerminated) return false;
      var api = getAPI();
      if (!api) return false;
      try {
        api.SetValue("cmi.exit", "normal");
        api.Commit("");
        var res = api.Terminate("");
        isTerminated = true;
        console.log("[SCORM 2004] Session terminated.");
        return res === "true" || res === true;
      } catch (e) {
        console.error("[SCORM 2004] Error during Terminate:", e);
        return false;
      }
    }
  };

  global.scorm2004 = scorm2004;

  global.addEventListener("beforeunload", function () {
    if (isInitialized && !isTerminated) {
      scorm2004.terminate();
    }
  });
})(typeof window !== "undefined" ? window : this);
