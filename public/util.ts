const operations = [
  {
    name: "Get Session User (logged in user)",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  },
  {
    name: "Create User",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "Update User",
    endpoint: "/api/users",
    method: "PATCH",
    fields: { update: "json" },
  },
  {
    name: "Get Users (empty for all)",
    endpoint: "/api/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  // {
  //   name: "Get Posts",
  //   endpoint: "/api/posts",
  //   method: "GET",
  //   fields: {},
  // },
  // {
  //   name: "Create Post",
  //   endpoint: "/api/posts",
  //   method: "POST",
  //   fields: { content: "textarea" },
  // },
  // {
  //   name: "Delete Post",
  //   endpoint: "/api/posts/:id",
  //   method: "DELETE",
  //   fields: { id: "input" },
  // },
  {
    name: "Create Map",
    endpoint: "/api/map",
    method: "POST",
    fields: { },
  },
  {
    name: "Select Location",
    endpoint: "/api/map/:mapid/:x/:y",
    method: "PATCH",
    fields: { mapid: "input", x: "input", y: "input" },
  },
  {
    name: "Drop Pin",
    endpoint: "/api/map/pin/:mapid",
    method: "PATCH",
    fields: { mapid: "input" },
  },
  {
    name: "Delete Pin",
    endpoint: "/api/map/pin/:mapid/:pinid",
    method: "DELETE",
    fields: { mapid: "input", pinid: "input" },
  },
  {
    name: "View Current User's PinPoints",
    endpoint: "/api/pinpoints/user",
    method: "GET",
    fields: {  },
  },
  {
    name: "Post a new PinPoint",
    endpoint: "/api/pinpoints/new/:pin/:content/:caption",
    method: "POST",
    fields: { pin: "input", content: "input", caption: "input" },
  },
  {
    name: "Edit Caption",
    endpoint: "/api/pinpoints/edit/:pinpointid/:caption",
    method: "PATCH",
    fields: { pinpointid: "input", caption: "input" },
  },
  {
    name: "Delete a PinPoint",
    endpoint: "/api/pinpoints/user/:_id",
    method: "DELETE",
    fields: { _id: "input" },
  },
  {
    name: "View all Collections",
    endpoint: "/api/collection",
    method: "GET",
    fields: { },
  },
  {
    name: "Search for a collection",
    endpoint: "/api/collection/:name",
    method: "GET",
    fields: { name: "input" },
  },
  {
    name: "Create collection",
    endpoint: "/api/collection/new/:name",
    method: "POST",
    fields: { name: "input" },
  },
  {
    name: "Add a pin to collection",
    endpoint: "/api/collection/:name/pins/:pinid",
    method: "PATCH",
    fields: { name: "input", pinid: "input" },
  },
  {
    name: "Add a user to a collection",
    endpoint: "/api/collection/:name/users/:username",
    method: "PATCH",
    fields: { name: "input", username: "input" },
  },
];

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }
    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });
    return {
      statusCode: (await res).status,
      response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: "???",
      response: { error: "Something went wrong, check your console log." },
    };
  }
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${Object.entries(operation.fields)
          .map(([name, type]) => {
            const tag = type === "json" ? "textarea" : type;
            return `<div class="field">
              <label for="${name}">${name}</label>
              <${tag} name="${name}" id="${name}"></${tag}>
            </div>`;
          })
          .join("")}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) =>
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

      const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
        const param = reqData[key] as string;
        delete reqData[key];
        return param;
      });

      // If field is json, parse it
      Object.entries(reqData).forEach(([key, value]) => {
        try {
          if ((operations.find((o) => o.endpoint === $endpoint && o.method == $method)?.fields as Record<string, string>)[key] === "json") {
            reqData[key] = JSON.parse(value as string);
          }
        } catch (e) {
          console.log(e);
        }
      });

      document.querySelector("#status-code")!.innerHTML = "";
      document.querySelector("#response-text")!.innerHTML = "Loading...";
      const response = await request($method as HttpMethod, endpoint as string, Object.keys(reqData).length > 0 ? reqData : undefined);
      document.querySelector("#response-text")!.innerHTML = JSON.stringify(response.response, null, 2);
      document.querySelector("#status-code")!.innerHTML = "(" + response.statusCode.toString() + ")";
    }),
  );
});
