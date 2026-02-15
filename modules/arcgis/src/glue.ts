import { Device, Resource, ResourceProps, Texture, TextureFormat, TextureView } from "@luma.gl/core";
import { WebGLDevice } from "@luma.gl/webgl";
import { WEBGLTextureView } from "@luma.gl/webgl/dist/adapter/resources/webgl-texture-view";

export abstract class GlueFramebuffer extends Resource<ResourceProps> {
  override get [Symbol.toStringTag](): string {
    return 'Framebuffer';
  }

  get width(): number {
    throw new Error("Not implemented.");
  }

  get height(): number {
    throw new Error("Not implemented.");
  }

  abstract colorAttachments: TextureView[];
  abstract depthStencilAttachment: TextureView | null;

  constructor(device: Device, props: ResourceProps = {}) {
    super(device, props, GlueFramebuffer.defaultProps);
  }

  /**
   * Create a copy of this framebuffer with new attached textures, with same props but of the specified size.
   * @note Does not copy contents of the attached textures.
   */
  clone(size?: {width: number; height: number}): GlueFramebuffer {
    throw new Error("Not implemented.");
  }

  /**
   * Resizes all attachments
   * @note resize() destroys existing textures (if size has changed).
   * @deprecated Use framebuffer.clone()
   */
  resize(size: {width: number; height: number}): void;
  resize(size: [width: number, height: number]): void;
  resize(): void;
  resize(size?: {width: number; height: number} | [width: number, height: number]): void {
    throw new Error("Not implemented.");
  }

  /** Auto creates any textures */
  protected autoCreateAttachmentTextures(): void {
    // throw new Error("Not implemented.");
  }

  protected createColorTexture(format: TextureFormat, index: number): Texture {
    throw new Error("Not implemented.");
  }

  /** Create depth stencil texture */
  protected createDepthStencilTexture(format: TextureFormat): Texture {
    throw new Error("Not implemented.");
  }


  /**
   * Default implementation of resize
   * Creates new textures with correct size for all attachments.
   * and destroys existing textures if owned
   */
  protected resizeAttachments(width: number, height: number): void {
    throw new Error("Not implemented.");
  }

  /** Implementation is expected to update any underlying binding (WebGL framebuffer attachment) */
  protected abstract updateAttachments(): void;

  static override defaultProps: Required<ResourceProps> = {
    ...Resource.defaultProps,
  };
}

export class GlueWEBGLFramebuffer extends GlueFramebuffer {
  readonly device: WebGLDevice;
  gl: WebGL2RenderingContext;
  readonly handle: WebGLFramebuffer;

  colorAttachments: WEBGLTextureView[] = ["ciao" as any];
  depthStencilAttachment: WEBGLTextureView | null = null;

  constructor(device: WebGLDevice, props: ResourceProps) {
    super(device, props);

    // WebGL default framebuffer handle is null
    const isDefaultFramebuffer = props.handle === null;

    this.device = device;
    this.gl = device.gl;
    this.handle =
      this.props.handle || isDefaultFramebuffer ? this.props.handle : this.gl.createFramebuffer();

    if (!isDefaultFramebuffer) {
      // default framebuffer handle is null, so we can't set debug metadata...
      device._setWebGLDebugMetadata(this.handle, this, {spector: this.props});

      // Auto create textures for attachments if needed
      this.autoCreateAttachmentTextures();

      this.updateAttachments();
    }
  }

  /** destroys any auto created resources etc. */
  override destroy(): void {
    throw new Error("Not implemented.");
  }

  protected updateAttachments(): void {
    // throw new Error("Not implemented.");
  }

  protected _attachTextureView(attachment: void, textureView: WEBGLTextureView): void {
    throw new Error("Not implemented.");
  }
}
