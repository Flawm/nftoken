import { Network } from "@glow-app/glow-client";
import { useGlowContext } from "@glow-app/glow-react";
import {
  GKeypair,
  GPublicKey,
  GTransaction,
  SolanaClient,
} from "@glow-app/solana-client";
import { useNetworkContext } from "./NetworkContext";
import { BadgeCheckIcon } from "@heroicons/react/outline";
import classNames from "classnames";
import { Form, Formik, useFormikContext } from "formik";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { NFTOKEN_ADDRESS } from "../utils/constants";
import { NFTOKEN_NFT_CREATE_IX } from "../utils/nft-borsh";
import { uploadJsonToS3 } from "../utils/upload-file";
import { LuxInputField } from "../components/LuxInput";
import { LuxButton, LuxSubmitButton } from "../components/LuxButton";
import { ImageDropZone } from "./forms/ImageDropZone";
import { InteractiveWell } from "./InteractiveWell";
import { NETWORK_TO_RPC } from "../utils/rpc-types";

type FormData = {
  name: string;
  image: string | null;
};

export const CreateNftSection = () => {
  const { user, glowDetected, signOut } = useGlowContext();
  const [success, setSuccess] = useState(false);

  const initialValues: FormData = { name: "", image: null };

  useEffect(() => {
    if (!success) {
      return;
    }

    const end = Date.now() + 3 * 1000;

    const shootConfetti = () => {
      confetti({
        particleCount: 40,
        spread: 180,
        startVelocity: 100,
        gravity: 3,
        colors: [
          "var(--red)",
          "var(--green)",
          "var(--barney)",
          "var(--purple)",
          "var(--yellow)",
          "var(--orange)",
        ],
        angle: 270,
        origin: { y: -1, x: 0.5 },
        disableForReducedMotion: true,
      });

      if (Date.now() < end) {
        requestAnimationFrame(shootConfetti);
      }
    };

    shootConfetti();

    setTimeout(() => {
      setSuccess(false);
    }, 7_500);
  }, [success, setSuccess]);

  const { network } = useNetworkContext();

  return (
    <div className="create-nft-section">
      <InteractiveWell
        title="Live Minting Demo"
        minimal={success}
        className="my-3"
      >
        <div className={classNames({ invisible: success })}>
          <Formik
            initialValues={initialValues}
            onSubmit={async ({ name, image }, { resetForm }) => {
              const { address: wallet } = await window.glow!.connect();

              const nft_keypair = GKeypair.generate();
              const { file_url: metadata_url } = await uploadJsonToS3({
                json: { name, image },
              });
              const recentBlockhash = await SolanaClient.getRecentBlockhash({
                rpcUrl: NETWORK_TO_RPC[network],
              });

              const transaction = GTransaction.create({
                feePayer: wallet,
                recentBlockhash,
                instructions: [
                  {
                    accounts: [
                      // NFT Creator
                      { address: wallet, signer: true, writable: true },
                      // Holder
                      { address: wallet, writable: false, signer: false },
                      {
                        address: nft_keypair.address,
                        signer: true,
                        writable: true,
                      },
                      {
                        address: GPublicKey.default.toString(),
                        writable: false,
                        signer: false,
                      },
                    ],
                    program: NFTOKEN_ADDRESS,
                    data_base64: NFTOKEN_NFT_CREATE_IX.toBuffer({
                      ix: null,
                      metadata_url,
                      collection_included: false,
                    }).toString("base64"),
                  },
                ],
                signers: [nft_keypair],
              });

              await window.glow!.signAndSendTransaction({
                transactionBase64: GTransaction.toBuffer({
                  gtransaction: transaction,
                }).toString("base64"),
                network: network ?? Network.Mainnet,
              });

              resetForm({ values: { name: "", image: null } });
              setSuccess(true);
            }}
          >
            <Form>
              <div className="mb-4">
                <LuxInputField label="Name" name="name" required />
              </div>

              <ImageDropZone<FormData> label="NFT Image" fieldName="image" />

              <div className="mt-4 flex-center spread">
                <SubmitButton />

                <LuxButton
                  label="Disconnect Wallet"
                  onClick={signOut}
                  size="small"
                  color="secondary"
                  variant="link"
                />
              </div>
            </Form>
          </Formik>
        </div>

        <div
          className={classNames("success", {
            visible: success && glowDetected && user,
          })}
        >
          <div className="success-icon text-success">
            <BadgeCheckIcon />
          </div>
          <p className="font-weight-medium text-success mb-0 text-center text-lg">
            <span>Your NFT has been minted!</span>
          </p>
        </div>
      </InteractiveWell>

      <style jsx>{`
        .invisible {
          opacity: 0;
          pointer-events: none;
        }

        .success {
          position: absolute;
          inset: 0;
          top: calc(50% - 2rem);
          opacity: 0;
          pointer-events: none;
          transition: var(--transition);
        }

        .success.visible {
          opacity: 1;
        }

        .success-icon {
          margin: 0 auto;
          max-width: max-content;
        }

        .success-icon :global(svg) {
          height: 1.5rem;
          width: 1.5rem;
        }
      `}</style>
    </div>
  );
};

const SubmitButton = () => {
  const { values } = useFormikContext();
  const data = values as FormData;

  return (
    <LuxSubmitButton
      label="Create NFT"
      rounded
      color="brand"
      disabled={!(data.name && data.image)}
    />
  );
};
