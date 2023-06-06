import React, { useState } from "react";
import { Alert, AlertProps } from "antd";

interface AlertApi {
  clear(): void;

  show(props: AlertProps): void;

  success(props: AlertProps): void;

  error(props: AlertProps): void;
}

export const useAlert = (): [AlertApi, React.ReactElement | null] => {
  const [element, setElement] = useState<React.ReactElement | null>(null);

  const clear = () => setElement(null);
  const show = (props: AlertProps) => setElement(<Alert showIcon {...props} />);

  const success = (props: AlertProps) => show({ ...props, type: "success" });
  const error = (props: AlertProps) => show({ ...props, type: "error" });

  const api = { clear, show, success, error };

  return [api, element];
};
