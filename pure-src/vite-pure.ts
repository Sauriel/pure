import type { Plugin, ResolvedConfig } from "vite";
import fs from "fs";

type PureOptions = {
  components: string[];
};

const DEFAULT_OPTIONS: PureOptions = {
  components: ["./src/components"],
};

function readFile(path: string): string | undefined {
  if (fs.existsSync(path)) {
    if (fs.existsSync(path)) {
      const content = fs.readFileSync(path, "utf-8");
      // ToDo extract style and script tags
      if (content.endsWith("\n")) {
        return content.slice(0, -1);
      } else {
        return content;
      }
    } else {
      return undefined;
    }
  } else {
    return undefined;
  }
}

function pure(options: Partial<PureOptions>): Plugin {
  const { components } = { ...DEFAULT_OPTIONS, ...options };
  let config: ResolvedConfig;

  function findComponent(templateId: string): string | undefined {
    const path = `${components[0]}/${templateId}.html`;
    return readFile(path);
  }

  function findPage(pageName?: string): string | undefined {
    const path = "./src/routes/index.html";
    const page = readFile(path);
    const layoutPath = "./src/routes/layout.html";
    const layout = readFile(layoutPath);
    if (page && layout) {
      return layout.replace("<template data-slot />", page);
    }
    return page;
  }

  function replaceTemplateSlot(
    html: string,
    tag: string,
    component: string
  ): string {
    const startOfTag = html.indexOf(tag);
    const endOfTag = html.indexOf("</template>", startOfTag);
    const contentOfTag = html.slice(startOfTag + tag.length, endOfTag);
    const componentContent = component.replace(
      "<template data-slot />",
      contentOfTag
    );
    return (
      html.slice(0, startOfTag) +
      componentContent +
      html.slice(endOfTag + "</template>".length)
    );
  }

  function findAndReplaceTemplates(html: string): string {
    const templateTags = html.match(/<template.*?(id=".*?").*?\/?>/g) ?? [];
    let newHtml = html;
    templateTags.forEach((tag) => {
      const templateId = tag.match(/id="(.*?)"/)!.at(1)!;
      if (tag.endsWith("/>")) {
        if (templateId === "_route") {
          const page = findPage();
          if (page) {
            newHtml = newHtml.replace(tag, findAndReplaceTemplates(page));
          }
        }
      } else {
        const component = findComponent(templateId);
        if (component) {
          newHtml = replaceTemplateSlot(newHtml, tag, component);
        }
      }
    });
    return newHtml;
  }

  return {
    name: "vite-pure",

    configResolved(resolvedConfig: ResolvedConfig) {
      // store the resolved config
      config = resolvedConfig;
    },

    transformIndexHtml(html: string) {
      // ToDo do not change index but create files for each route
      return findAndReplaceTemplates(html);
    },
  };
}

export default pure;
