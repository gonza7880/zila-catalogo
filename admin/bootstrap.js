import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, isSupabaseConfigured } from "../supabase-config.js";

const $ = id => document.getElementById(id);

function installRecoveryUi(){
  const card = document.querySelector("#loginView .login-card");
  if(!card || $("forgotPasswordBtn")) return;

  const forgot = document.createElement("button");
  forgot.id = "forgotPasswordBtn";
  forgot.type = "button";
  forgot.className = "auth-link";
  forgot.textContent = "Olvidé mi contraseña";
  card.insertBefore(forgot, $("loginError"));

  const status = document.createElement("p");
  status.id = "loginStatus";
  status.className = "auth-success";
  card.appendChild(status);

  const reset = document.createElement("section");
  reset.id = "resetView";
  reset.className = "login-view";
  reset.hidden = true;
  reset.innerHTML = `
    <div class="login-card">
      <img src="/logo-zila.jpg" alt="ZILA" class="login-logo">
      <span class="eyebrow">Seguridad</span>
      <h1>Nueva contraseña</h1>
      <p>Elegí una nueva contraseña para volver a ingresar al administrador.</p>
      <form id="resetPasswordForm">
        <label>Nueva contraseña<input id="newPassword" type="password" minlength="8" required autocomplete="new-password"></label>
        <label>Repetir contraseña<input id="confirmPassword" type="password" minlength="8" required autocomplete="new-password"></label>
        <button class="btn btn-dark" type="submit">Guardar nueva contraseña</button>
      </form>
      <p id="resetStatus" class="auth-success"></p>
      <p id="resetError" class="error"></p>
    </div>`;
  $("loginView").insertAdjacentElement("afterend", reset);

  const style = document.createElement("style");
  style.textContent = `
    .auth-link{display:block;width:100%;margin:4px 0 0;padding:6px 0;border:0;background:transparent;color:#746e66;text-align:center;font-size:12px;font-weight:700;text-decoration:underline;text-underline-offset:3px}
    .auth-link:hover{color:#171614}
    .auth-success{color:#216636!important;font-size:12px;line-height:1.45;min-height:17px}
    #resetView[hidden]{display:none!important}
  `;
  document.head.appendChild(style);
}

installRecoveryUi();

if(!isSupabaseConfigured){
  await import("/admin/admin.js");
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const pageUrl = new URL(window.location.href);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  let recoveryMode =
    pageUrl.searchParams.has("code") ||
    pageUrl.searchParams.get("type") === "recovery" ||
    hashParams.get("type") === "recovery";

  function showReset(){
    recoveryMode = true;
    $("loginView").hidden = true;
    $("adminView").hidden = true;
    $("resetView").hidden = false;
  }

  function showLoginMessage(message){
    $("resetView").hidden = true;
    $("loginView").hidden = false;
    $("loginStatus").textContent = message || "";
  }

  async function waitForSession(timeoutMs = 6000){
    const { data:{ session } } = await supabase.auth.getSession();
    if(session) return session;

    return await new Promise(resolve => {
      let done = false;
      let subscription = null;
      let timer = null;

      const finish = value => {
        if(done) return;
        done = true;
        if(timer) clearTimeout(timer);
        subscription?.unsubscribe();
        resolve(value);
      };

      const listener = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if(nextSession) finish(nextSession);
      });
      subscription = listener.data.subscription;
      timer = setTimeout(() => finish(null), timeoutMs);
    });
  }

  supabase.auth.onAuthStateChange((event) => {
    if(event === "PASSWORD_RECOVERY") showReset();
  });

  $("forgotPasswordBtn").addEventListener("click", async () => {
    const email = $("loginEmail").value.trim();
    $("loginError").textContent = "";
    $("loginStatus").textContent = "";

    if(!email){
      $("loginError").textContent = "Ingresá tu email arriba para enviarte el enlace de recuperación.";
      $("loginEmail").focus();
      return;
    }

    $("forgotPasswordBtn").disabled = true;
    $("forgotPasswordBtn").textContent = "Enviando…";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin`
    });

    $("forgotPasswordBtn").disabled = false;
    $("forgotPasswordBtn").textContent = "Olvidé mi contraseña";

    if(error){
      $("loginError").textContent = "No se pudo enviar el email de recuperación. Intentá nuevamente.";
      return;
    }

    $("loginStatus").textContent = "Te enviamos un enlace para crear una nueva contraseña. Revisá también spam o correo no deseado.";
  });

  $("resetPasswordForm").addEventListener("submit", async event => {
    event.preventDefault();
    const password = $("newPassword").value;
    const confirm = $("confirmPassword").value;
    const button = $("resetPasswordForm").querySelector("button");
    $("resetError").textContent = "";
    $("resetStatus").textContent = "";

    if(password.length < 8){
      $("resetError").textContent = "La contraseña debe tener al menos 8 caracteres.";
      return;
    }
    if(password !== confirm){
      $("resetError").textContent = "Las contraseñas no coinciden.";
      return;
    }

    button.disabled = true;
    button.textContent = "Guardando…";

    const session = await waitForSession();
    if(!session){
      button.disabled = false;
      button.textContent = "Guardar nueva contraseña";
      $("resetError").textContent = "El enlace no pudo validarse o venció. Volvé al login y pedí uno nuevo.";
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if(error){
      button.disabled = false;
      button.textContent = "Guardar nueva contraseña";
      $("resetError").textContent = "No se pudo actualizar la contraseña. Pedí un nuevo enlace e intentá otra vez.";
      return;
    }

    $("resetStatus").textContent = "Contraseña actualizada correctamente.";
    await supabase.auth.signOut();
    window.history.replaceState({}, document.title, "/admin?password=updated");
    window.location.reload();
  });

  if(pageUrl.searchParams.get("password") === "updated"){
    window.history.replaceState({}, document.title, "/admin");
    showLoginMessage("Contraseña actualizada. Ya podés ingresar con tu nueva contraseña.");
  }

  if(recoveryMode){
    showReset();
  } else {
    await new Promise(resolve => setTimeout(resolve, 450));
    if(!recoveryMode) await import("/admin/admin.js");
  }
}
